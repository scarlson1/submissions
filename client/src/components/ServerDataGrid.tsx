import { Box } from '@mui/material';
import {
  DataGrid,
  DataGridProps,
  GridCallbackDetails,
  GridColDef,
  GridPaginationModel,
  GridRowSelectionModel,
  useGridApiRef,
} from '@mui/x-data-grid';
import { DocumentSnapshot, QueryFieldFilterConstraint } from 'firebase/firestore';
import { lowerCase } from 'lodash';
import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { COLLECTIONS } from 'common';
import {
  useFetchDocCount,
  useFetchDocsWithCursor,
  useGridServerFilter,
  useGridServerSort,
  useWidth,
} from 'hooks';
import { getOrderByIfNecessary } from 'modules/muiGrid/utils';
import { GridMobileToolbar } from './GridMobileToolbar';
import { GridToolbar } from './GridToolbar';

declare module '@mui/x-data-grid' {
  interface ToolbarPropsOverrides {
    colname: string;
    constraints: QueryFieldFilterConstraint[];
  }
}

// FIREBASE PAGINATION ARTICLE: https://makerkit.dev/blog/tutorials/pagination-react-firebase-firestore
// TODO: handle row selection for server-side pagination: https://mui.com/x/react-data-grid/row-selection/#usage-with-server-side-pagination

// TODO: move pagination to a hook ?? https://github.com/mui/mui-x/issues/409#issuecomment-1312083757
// mui useGridFilter hook: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/hooks/features/filter/useGridFilter.tsx

// TODO: add firestore converter prop (default to withId ?? how would ID column be handled if converter didn't add id to doc data ??)

// TODO: need to pass in "constraints" passed as prop to server grid (or create additional custom grid context component to store server-side filters & sort) ??

// TODO: need to disable certain types of filters when query limits are met
// https://firebase.google.com/docs/firestore/query-data/queries#query_limitations
// ex: can't combine not-in with in, array-contains-any, or or

export interface ServerDataGridProps extends Partial<Omit<DataGridProps, 'rows'>> {
  colName: keyof typeof COLLECTIONS;
  pathSegments?: string[];
  constraints?: QueryFieldFilterConstraint[];
  isCollectionGroup?: boolean;
  columns: GridColDef[];
}

//  inequality filter property and first sort order must be the same

export const ServerDataGrid = ({
  colName,
  pathSegments = [],
  constraints = [],
  isCollectionGroup = false,
  columns,
  slots,
  slotProps,
  ...props
}: ServerDataGridProps) => {
  // https://mui.com/blog/mui-x-v6/#apiref-moved-to-the-mit-community-version (pagination, scrolling, state)
  const apiRef = useGridApiRef();
  const { isMobile } = useWidth();
  const toolbar = useMemo(() => (isMobile ? GridMobileToolbar : GridToolbar), [isMobile]);
  // console.log('grid state: ', apiRef.current.state);

  const [rowCount, setRowCount] = useState<number>(0);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const cursors = useRef<Map<number, DocumentSnapshot>>(new Map());

  const resetCursors = useCallback(() => {
    setPaginationModel((model) => ({ ...model, page: 0 }));
    cursors.current = new Map();
  }, []);

  const { sortModel, sortOps, handleSortModelChange } = useGridServerSort(
    props?.initialState,
    resetCursors
  );
  const { filters, handleFilterChange } = useGridServerFilter(props?.initialState, resetCursors);
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);

  const queryOptions = useMemo(() => {
    const orderByConstraint = getOrderByIfNecessary(constraints);

    return [...filters, ...constraints, ...orderByConstraint, ...sortOps.current];
  }, [filters, constraints, sortModel, sortOps]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCount = useFetchDocCount(
    colName,
    [...filters, ...constraints], // TODO: does aggregation query need order by if inequality operator ?? ... getOrderByIfNecessary(constraints)
    isCollectionGroup,
    pathSegments
  );

  useEffect(() => {
    // TODO: usePrevious queryOptions ??
    fetchCount().then((result) => setRowCount(result.data().count));
  }, [fetchCount, queryOptions]);

  // subscribe to collection, update when page, filters, sort change
  const { data, status } = useFetchDocsWithCursor(
    colName,
    queryOptions,
    {
      cursor: cursors.current.get(paginationModel.page),
      itemsPerPage: paginationModel.pageSize,
    },
    isCollectionGroup,
    pathSegments
  );

  const rowData = useMemo(
    () => data?.docs?.map((doc: any) => ({ ...doc.data(), id: doc.id })) ?? [],
    [data]
  );

  // apiRef.current?.subscribeEvent('paginationModelChange', () => console.log('pagination event'));
  // TODO: disable next button until the next cursor snapshot is known
  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel, details: GridCallbackDetails<any>) => {
      startTransition(() => {
        setPaginationModel((currModel) => {
          const staleData =
            cursors.current.get(currModel.page + 2)?.id === data.docs[data.docs.length - 1]?.id; // Delete ?? bug caused by useMemo in fetch data hook (resolved)

          // save the last document as next page's cursor (query uses "startAfter(snap)")
          if (model.page !== currModel.page && !staleData)
            cursors.current.set(currModel.page + 1, data.docs[data.docs.length - 1]);

          // TODO: better solution to resetting cursors on page size change
          // encode page, page size, filter, and sort in cursor key (like react-query / reactFire id) --> if doesn't exists reset to page 0 ??
          // or cache all snapshots --> get new cursors from cache when page size changes
          // temporary solution:
          if (model.pageSize !== currModel.pageSize) {
            resetCursors();
            return { ...model, page: 0 };
          }

          return model;
        });
      });
    },
    [data, resetCursors]
  );

  // const handleExport = useCallback(
  //   (options: GridCsvExportOptions) => apiRef.current.exportDataAsCsv(options),
  //   [apiRef]
  // );

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <DataGrid
        apiRef={apiRef}
        sx={{
          transition: 'height 0.25s ease-in-out',
          '& .MuiDataGrid-toolbarContainer': {
            flexWrap: 'nowrap',
            overflowX: 'auto',
            mx: { xs: 2 },
            '& .MuiButton-root': {
              flexShrink: 0,
            },
          },
          '& .MuiDataGrid-toolbarContainer::-webkit-scrollbar': {
            display: 'none',
          },
          '& .MuiDataGrid-main': {
            maxHeight: { xs: 300, sm: 360, md: 400, lg: 420 },
            overflowY: 'auto',
          },
          '.MuiDataGrid-main > div:nth-of-type(2)': { overflowY: 'auto !important' },
        }}
        pageSizeOptions={[5, 10, 25]}
        {...props}
        rows={rowData}
        columns={columns}
        loading={status === 'loading'}
        pagination
        paginationMode='server'
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        rowCount={rowCount}
        sortingMode='server'
        sortModel={sortModel}
        onSortModelChange={handleSortModelChange}
        filterMode='server'
        onFilterModelChange={handleFilterChange}
        slots={{
          toolbar,
          ...(slots || {}),
        }}
        slotProps={{
          ...(slotProps || {}),
          toolbar: {
            csvOptions: {
              // allColumns: true,
              fileName: `iDemand ${lowerCase(colName)} export`,
            },
            printOptions: { disableToolbarButton: true },
            ...(slotProps?.toolbar || {}),
            colname: COLLECTIONS[colName],
            constraints,
          },
          baseIconButton: {
            sx: {
              border: 'none',
              '&:hover': {
                border: 'none',
              },
            },
          },
        }}
        // slots={{
        //   loadingOverlay: LinearProgress, // displayed when loading = true
        // }}
        // no rows image: https://mui.com/x/react-data-grid/components/#no-rows-overlay
        // slots={{
        //   noRowsOverlay: CustomNoRowsOverlay,
        // }}
        onRowSelectionModelChange={(newRowSelectionModel, details: GridCallbackDetails<any>) => {
          setRowSelectionModel(newRowSelectionModel);
        }}
        rowSelectionModel={rowSelectionModel}
        keepNonExistentRowsSelected
      />
    </Box>
  );
};
