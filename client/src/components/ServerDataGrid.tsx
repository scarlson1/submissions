import React, { useCallback, useEffect, useMemo, useRef, useState, startTransition } from 'react';
import { Box } from '@mui/material';
import {
  DataGrid,
  DataGridProps,
  getGridDateOperators,
  getGridNumericOperators,
  getGridStringOperators,
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
  where,
} from 'firebase/firestore';

import { useDocCount, useFetchDocsWithCursor } from 'hooks';
import { COLLECTIONS } from 'common';
import { isRangeComparison, muiOperatorToFirestoreOperator } from 'modules/utils';

// FIREBASE PAGINATION ARTICLE: https://makerkit.dev/blog/tutorials/pagination-react-firebase-firestore

export interface ServerDataGridProps extends Partial<DataGridProps> {
  collName: keyof typeof COLLECTIONS;
  pathSegments?: string[];
  constraints?: QueryFieldFilterConstraint[];
  isCollectionGroup?: boolean;
  columns: GridColDef[];
}

export const ServerDataGrid: React.FC<ServerDataGridProps> = ({
  collName,
  pathSegments = [],
  constraints = [],
  isCollectionGroup = false,
  columns,
  // density = 'compact',
  ...rest
}) => {
  // const [isPending, startTransition] = useTransition();
  // const [densityV, setDensity] = useState<GridDensity>(density);
  const [paginationModel, setPaginationModel] = React.useState({
    pageSize: 10,
    page: 0,
  });
  const [rowCount, setRowCount] = useState<number>(0);
  const [sortOptions, setSortOptions] = useState<QueryOrderByConstraint[]>([
    orderBy('metadata.created', 'desc'),
  ]);
  const [filters, setFilters] = useState<(QueryFieldFilterConstraint | QueryOrderByConstraint)[]>(
    []
  );
  const queryOptions = useMemo(
    () => [...filters, ...constraints, ...sortOptions],
    [constraints, sortOptions, filters]
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

  // TODO: store filter in same array ??
  const handleSortModelChange = useCallback((sortModel: GridSortModel) => {
    let newOptions: QueryOrderByConstraint[] = [];
    sortModel.forEach((f) => {
      if (f.sort) newOptions.push(orderBy(f.field, f.sort));
    });

    startTransition(() => {
      setSortOptions([...newOptions]);
    });
  }, []);

  const handleFilterChange = useCallback((filterModel: GridFilterModel) => {
    console.log('FILTER MODEL: ', filterModel);
    const newFilters: (QueryFieldFilterConstraint | QueryOrderByConstraint)[] = [];
    // TODO: mui grid operator to firebase operator convertion (datetime "after" =>  ">", "is" => "==")
    // TODO: create custom operators that map to firestore - https://mui.com/x/react-data-grid/filtering/#create-a-custom-operator
    // OR - remove operators - https://mui.com/x/react-data-grid/filtering/#remove-an-operator
    // TODO: check for limitations - https://firebase.google.com/docs/firestore/query-data/queries#query_limitations

    filterModel.items.forEach((f) => {
      // TODO: bug - isNotEmpty passes a value of undefined
      if (f.value !== undefined && f.operator) {
        let op = muiOperatorToFirestoreOperator(f.operator);
        let val = f.operator === 'isNotEmpty' ? false : f.value;
        if (op) newFilters.push(where(f.field, op, val));
        // TODO: handle isNotEmpty (where('field', '!=', false))
        // FIRESTORE LIMITATION - MUST SORT BY COLUMN IF USING >, < >=, <= OPERATORS
        if (isRangeComparison(f.operator)) newFilters.push(orderBy(f.field));
      }
    });

    console.log('NEW FILTERS: ', newFilters);
    startTransition(() => {
      setFilters(newFilters);
    });
  }, []);

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
        sx={{ transition: 'height 0.25s ease-in-out' }}
        // rowsPerPageOptions={[5, 10, 25, 100]}
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
        loading={status === 'loading'} // || isPending
        pagination
        paginationMode='server'
        // paginationModel={{ page, pageSize }}
        paginationModel={paginationModel}
        onPaginationModelChange={handlePaginationModelChange}
        // page={page}
        // onPageChange={onPageChanged}
        // pageSize={pageSize}
        // onPageSizeChange={(newSize) => setPageSize(newSize)}
        rowCount={rowCount}
        sortingMode='server'
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

export const numericOperators = getGridNumericOperators().filter(
  (operator) =>
    operator.value === '>' ||
    operator.value === '<' ||
    operator.value === '>=' ||
    operator.value === '<=' ||
    operator.value === '=' ||
    operator.value === 'isAnyOf'
);

export const dateOperators = getGridDateOperators().filter(
  (operator) =>
    operator.value === 'is' ||
    operator.value === 'onOrAfter' ||
    operator.value === 'onOrBefore' ||
    operator.value === 'after' ||
    operator.value === 'before'
);

export const stringOperators = getGridStringOperators().filter(
  (operator) =>
    operator.value === 'equals' || operator.value === 'isAnyOf' || operator.value === 'isNotEmpty'
);
