import { startTransition, useCallback, useState } from 'react';
import { GridCallbackDetails, GridFilterModel, GridInitialState } from '@mui/x-data-grid';
import { QueryFieldFilterConstraint, QueryOrderByConstraint } from 'firebase/firestore';

import { getFirestoreFilters } from 'modules/muiGrid';

export const useGridServerFilter = (initialState?: GridInitialState | undefined) => {
  const [filters, setFilters] = useState<(QueryFieldFilterConstraint | QueryOrderByConstraint)[]>(
    getFirestoreFilters(initialState?.filter?.filterModel)
  );

  const handleFilterChange = useCallback(
    (filterModel: GridFilterModel, details: GridCallbackDetails) => {
      // console.log('FILTER MODEL: ', filterModel, details);
      const newFilters = getFirestoreFilters(filterModel);

      // console.log('NEW FILTERS: ', newFilters);
      startTransition(() => {
        setFilters([...newFilters]);
      });
    },
    []
  );

  return { filters, handleFilterChange };
};
