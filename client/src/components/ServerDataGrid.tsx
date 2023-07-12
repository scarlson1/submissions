import { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { Box } from '@mui/material';
import {
  DataGrid,
  DataGridProps,
  GridCallbackDetails,
  GridColDef,
  GridPaginationModel,
  GridRowSelectionModel,
  GridToolbar,
} from '@mui/x-data-grid';
import { DocumentSnapshot, QueryFieldFilterConstraint } from 'firebase/firestore';
import { lowerCase } from 'lodash';

import {
  useDocCount,
  useFetchDocsWithCursor,
  useWidth,
  useGridServerSort,
  useGridServerFilter,
} from 'hooks';
import { COLLECTIONS } from 'common';
import { GridMobileToolbar } from './GridMobileToolbar';

// FIREBASE PAGINATION ARTICLE: https://makerkit.dev/blog/tutorials/pagination-react-firebase-firestore
// TODO: handle row selection for server-side pagination: https://mui.com/x/react-data-grid/row-selection/#usage-with-server-side-pagination

// TODO: move pagination to a hook ?? https://github.com/mui/mui-x/issues/409#issuecomment-1312083757
// mui useGridFilter hook: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/hooks/features/filter/useGridFilter.tsx

export interface ServerDataGridProps extends Partial<Omit<DataGridProps, 'rows'>> {
  collName: keyof typeof COLLECTIONS;
  pathSegments?: string[];
  constraints?: QueryFieldFilterConstraint[];
  isCollectionGroup?: boolean;
  columns: GridColDef[];
}

export const ServerDataGrid = ({
  collName,
  pathSegments = [],
  constraints = [],
  isCollectionGroup = false,
  columns,
  slots,
  slotProps,
  ...props
}: ServerDataGridProps) => {
  const { isMobile } = useWidth();
  const toolbar = useMemo(() => (isMobile ? GridMobileToolbar : GridToolbar), [isMobile]);

  const [rowCount, setRowCount] = useState<number>(0);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });

  const { sortModel, sortOps, handleSortModelChange } = useGridServerSort(props?.initialState);
  const { filters, handleFilterChange } = useGridServerFilter(props?.initialState);
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);

  const queryOptions = useMemo(
    () => [...filters, ...constraints, ...sortOps.current],
    [filters, constraints] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const fetchCount = useDocCount(collName, [...filters, ...constraints]);
  // fetch count whenever query changes
  useEffect(() => {
    fetchCount().then((result) => {
      setRowCount(result.data().count);
    });
  }, [fetchCount, queryOptions]);

  // keep cursors in memory
  const cursors = useRef<Map<number, DocumentSnapshot>>(new Map());

  // subscribe to collection, update when page, filters, sort change
  const { data, status } = useFetchDocsWithCursor(
    collName,
    queryOptions,
    {
      cursor: cursors.current.get(paginationModel.page),
      itemsPerPage: paginationModel.pageSize,
    },
    isCollectionGroup,
    pathSegments
  );

  const rowData = useMemo(() => {
    return data?.docs?.map((doc: any) => ({ ...doc.data(), id: doc.id })) ?? [];
  }, [data]);

  const handlePaginationModelChange = useCallback(
    (model: GridPaginationModel, details: GridCallbackDetails<any>) => {
      startTransition(() => {
        setPaginationModel((currModel) => {
          // save the last document as page's cursor (query uses "startAfter(snap)")
          if (model.page !== currModel.page)
            cursors.current.set(currModel.page + 1, data.docs[data.docs.length - 1]);

          // update state to the next page's number
          return model;
        });
      });
    },
    [data]
  );

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <DataGrid
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
              fileName: `iDemand ${lowerCase(collName)} export`,
            },
            printOptions: { disableToolbarButton: true },
            ...(slotProps?.toolbar || {}),
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
          console.log('NEW ROW SELECTION MODEL: ', newRowSelectionModel, details);
          setRowSelectionModel(newRowSelectionModel);
        }}
        rowSelectionModel={rowSelectionModel}
        keepNonExistentRowsSelected
      />
    </Box>
  );
};
