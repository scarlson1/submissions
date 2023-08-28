import { startTransition, useCallback, useEffect, useState } from 'react';
import { GridCallbackDetails, GridFilterModel, GridInitialState } from '@mui/x-data-grid';
import { QueryFieldFilterConstraint, QueryOrderByConstraint } from 'firebase/firestore';
import { isEqual } from 'lodash';

import { getFirestoreFilters } from 'modules/muiGrid';
import { usePrevious } from './usePrevious';

// https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/hooks/features/filter/useGridFilter.tsx

export const useGridServerFilter = (
  initialState?: GridInitialState | undefined,
  resetCursors?: () => void
) => {
  const [filters, setFilters] = useState<(QueryFieldFilterConstraint | QueryOrderByConstraint)[]>(
    getFirestoreFilters(initialState?.filter?.filterModel)
  );
  const prevFilters = usePrevious(filters);

  useEffect(() => {
    if (resetCursors && prevFilters && !isEqual(filters, prevFilters)) {
      console.log('RESET CURSORS (FILTER DIFF)');
      resetCursors();
    }
  }, [resetCursors, filters, prevFilters]);

  const handleFilterChange = useCallback(
    (filterModel: GridFilterModel, details: GridCallbackDetails) =>
      startTransition(() => {
        setFilters([...getFirestoreFilters(filterModel)]);
      }),
    []
  );

  // const handleFilterChange = useCallback(
  //   (filterModel: GridFilterModel, details: GridCallbackDetails) => {
  //     const newFilters = getFirestoreFilters(filterModel);

  //     // console.log('NEW FILTERS: ', newFilters);
  //     startTransition(() => {
  //       setFilters([...newFilters]);
  //     });
  //   },
  //   []
  // );

  return { filters, handleFilterChange };
};
