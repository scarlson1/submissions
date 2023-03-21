import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Box } from '@mui/material';
import {
  DataGrid,
  DataGridProps,
  getGridDateOperators,
  getGridNumericOperators,
  getGridStringOperators,
  GridColDef,
  GridFilterModel,
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
  constraints?: QueryFieldFilterConstraint[];
  columns: GridColDef[];
}

export const ServerDataGrid: React.FC<ServerDataGridProps> = ({
  collName,
  constraints = [],
  columns,
  ...rest
}) => {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
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
  }, [fetchCount, queryOptions]); // need to include contraints in dependencies ??

  // keep cursors in memory
  const cursors = useRef<Map<number, DocumentSnapshot>>(new Map());

  const { data, status } = useFetchDocsWithCursor(collName, queryOptions, {
    cursor: cursors.current.get(page),
    itemsPerPage: pageSize,
  });

  const rowData = useMemo(() => {
    return data?.docs?.map((doc) => ({ ...doc.data(), id: doc.id })) ?? [];
  }, [data]);

  const onPageChanged = useCallback(
    (nextPage: number) => {
      setPage((page) => {
        // first, save the last document as page's cursor (query uses "startAfter(snap)")
        cursors.current.set(page + 1, data.docs[data.docs.length - 1]);

        // update state to the next page's number
        return nextPage;
      });
    },
    [data]
  );

  // TODO: store filter in same array ??
  const handleSortModelChange = useCallback((sortModel: GridSortModel) => {
    let newOptions: QueryOrderByConstraint[] = [];
    sortModel.forEach((f) => {
      if (f.sort) newOptions.push(orderBy(f.field, f.sort));
    });

    setSortOptions([...newOptions]);
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
      if (f.value !== undefined && f.operatorValue) {
        let op = muiOperatorToFirestoreOperator(f.operatorValue);
        let val = f.operatorValue === 'isNotEmpty' ? false : f.value;
        if (op) newFilters.push(where(f.columnField, op, val));
        // TODO: handle isNotEmpty (where('field', '!=', false))
        // FIRESTORE LIMITATION - MUST SORT BY COLUMN IF USING >, < >=, <= OPERATORS
        if (isRangeComparison(f.operatorValue)) newFilters.push(orderBy(f.columnField));
      }
    });

    console.log('NEW FILTERS: ', newFilters);
    setFilters(newFilters);
  }, []);

  return (
    <Box sx={{ height: 500, width: '100%' }}>
      <DataGrid
        rowsPerPageOptions={[5, 10, 25, 100]}
        {...rest}
        rows={rowData}
        columns={columns}
        loading={status === 'loading'}
        pagination
        paginationMode='server'
        page={page}
        onPageChange={onPageChanged}
        pageSize={pageSize}
        onPageSizeChange={(newSize) => setPageSize(newSize)}
        rowCount={rowCount}
        sortingMode='server'
        onSortModelChange={handleSortModelChange}
        filterMode='server'
        onFilterModelChange={handleFilterChange}
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
