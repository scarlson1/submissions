import React, { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { Box } from '@mui/material';
import {
  DataGrid,
  DataGridProps,
  GridCallbackDetails,
  GridColDef,
  GridFilterModel,
  GridPaginationModel,
  GridSortModel,
} from '@mui/x-data-grid';
import {
  DocumentSnapshot,
  orderBy,
  QueryFieldFilterConstraint,
  QueryOrderByConstraint,
  Timestamp,
  where,
  WhereFilterOp,
} from 'firebase/firestore';

import { useDocCount, useFetchDocsWithCursor } from 'hooks';
import { COLLECTIONS } from 'common';
import { isInequalityOp, isWhereFilterOp } from 'modules/utils';

// FIREBASE PAGINATION ARTICLE: https://makerkit.dev/blog/tutorials/pagination-react-firebase-firestore

export interface ServerDataGridProps extends Partial<Omit<DataGridProps, 'rows'>> {
  collName: keyof typeof COLLECTIONS;
  pathSegments?: string[];
  constraints?: QueryFieldFilterConstraint[];
  isCollectionGroup?: boolean;
  columns: GridColDef[];
  // TODO: initSorting
}

export const ServerDataGrid: React.FC<ServerDataGridProps> = ({
  collName,
  pathSegments = [],
  constraints = [],
  isCollectionGroup = false,
  columns,
  ...rest
}) => {
  // const [isPending, startTransition] = useTransition();
  // const [densityV, setDensity] = useState<GridDensity>(density);
  const [rowCount, setRowCount] = useState<number>(0);
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });

  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'metadata.created', sort: 'desc' },
  ]);
  // ref works because setting sortModel triggers rerender ??
  const sortOps = useRef<QueryOrderByConstraint[]>([orderBy('metadata.created', 'desc')]);
  const [filters, setFilters] = useState<(QueryFieldFilterConstraint | QueryOrderByConstraint)[]>(
    []
  );

  const queryOptions = useMemo(
    () => [...filters, ...constraints, ...sortOps.current],
    [filters, constraints]
  );

  const fetchCount = useDocCount(collName, [...filters, ...constraints]);

  useEffect(() => {
    fetchCount().then((result) => {
      setRowCount(result.data().count);
    });
  }, [fetchCount, queryOptions]);

  // keep cursors in memory
  const cursors = useRef<Map<number, DocumentSnapshot>>(new Map());

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
  // const deferredData = useDeferredValue(data);

  const rowData = useMemo(() => {
    return data?.docs?.map((doc) => ({ ...doc.data(), id: doc.id })) ?? [];
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
    [data] // page, pageSize]
  );

  const handleSortModelChange = useCallback((sortModel: GridSortModel) => {
    let newOptions: QueryOrderByConstraint[] = [];

    sortModel.forEach((f) => {
      if (f.sort) newOptions.push(orderBy(f.field, f.sort));
    });

    sortOps.current = [...newOptions];
    startTransition(() => {
      setSortModel([...sortModel]);
    });
  }, []);

  // TODO: create custom grid filter operators that map to firebase
  // https://mui.com/x/react-data-grid/filtering/customization/#create-a-custom-operator
  const handleFilterChange = useCallback(
    (filterModel: GridFilterModel, details: GridCallbackDetails) => {
      console.log('FILTER MODEL: ', filterModel, details);
      const newFilters: (QueryFieldFilterConstraint | QueryOrderByConstraint)[] = [];
      // TODO: check for limitations - https://firebase.google.com/docs/firestore/query-data/queries#query_limitations

      filterModel.items.forEach((f) => {
        let isNotEmptyFilter = f.value !== undefined || f.operator === '!=';
        let valDefined = f.value !== undefined;
        let isEmptyArr = Array.isArray(f.value) && !f.value?.length;
        const isFilterOp = isWhereFilterOp(f.operator);

        if ((valDefined || isNotEmptyFilter) && !isEmptyArr && isFilterOp) {
          let op = f.operator as WhereFilterOp;
          let val = f.value ?? false;
          console.log('val is timestamp: ', val instanceof Timestamp);
          console.log('val is date: ', val instanceof Date);
          if (val instanceof Date) val = Timestamp.fromDate(new Date(val));

          if (isInequalityOp(op)) newFilters.push(orderBy(f.field, 'desc'));
          if (op) newFilters.push(where(f.field, op, val));
        }
      });

      console.log('NEW FILTERS: ', newFilters);
      startTransition(() => {
        setFilters([...newFilters]);
      });
    },
    []
  );

  // const rowHeight = useMemo(() => {
  //   console.log('ROW HEIGHT CHANGE: ', density);
  //   if (density === 'compact') return 52;
  //   if (density === 'comfortable') return 100;
  //   return 76;
  // }, [density]);
  // const baseHeight = useMemo(() => {}, []);

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      {/* <Box
      sx={{
        height: 108 + Math.min(pageSize, rowData.length) * rowHeight + 'px',
        width: '100%',
        transition: 'all 0.25s ease-in-out',
      }}
    > */}
      <DataGrid
        sx={{
          transition: 'height 0.25s ease-in-out',
          '& .MuiDataGrid-main': {
            maxHeight: { xs: 300, sm: 360, md: 400, lg: 420 },
            overflowY: 'auto',
          },
          '.MuiDataGrid-main > div:nth-of-type(2)': { overflowY: 'auto !important' },
        }}
        pageSizeOptions={[5, 10, 25, 100]}
        {...rest}
        // density={densityV}
        // rowHeight={rowHeight}
        // onStateChange={(v) =>
        //   v.state?.density?.value &&
        //   densityV !== v.state?.density?.value &&
        //   setDensity(v.state.density.value)
        // }
        rows={rowData}
        // rows={deferredData}
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
        // slots={{
        //   loadingOverlay: LinearProgress, // displayed when loading = true
        // }}
        // no rows image: https://mui.com/x/react-data-grid/components/#no-rows-overlay
        // slots={{
        //   noRowsOverlay: CustomNoRowsOverlay,
        // }}
      />
    </Box>
  );
};
