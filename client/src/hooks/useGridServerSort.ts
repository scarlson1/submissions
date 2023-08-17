import { GridInitialState, GridSortModel } from '@mui/x-data-grid';
import { QueryOrderByConstraint, orderBy } from 'firebase/firestore';
import { startTransition, useCallback, useRef, useState } from 'react';

import { getFirestoreSortOps } from 'modules/muiGrid';

export const useGridServerSort = (initialState?: GridInitialState | undefined) => {
  const [sortModel, setSortModel] = useState<GridSortModel>(initialState?.sorting?.sortModel || []);

  const sortOps = useRef<QueryOrderByConstraint[]>([
    ...getFirestoreSortOps(initialState?.sorting?.sortModel),
  ]);

  // initialize sortOps converting modelState to firestore sorting constraints
  // useEffect(() => {
  //   sortOps.current = getFirestoreSortOps(initialState?.sorting?.sortModel);
  // }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSortModelChange = useCallback((sortModel: GridSortModel) => {
    let newOptions: QueryOrderByConstraint[] = [];

    sortModel.forEach((f) => {
      if (f.sort) newOptions.push(orderBy(f.field, f.sort));
    });

    console.log('SETTING SORT OPTIONS', newOptions);
    sortOps.current = [...newOptions];
    startTransition(() => {
      setSortModel([...sortModel]);
    });
  }, []);

  return { sortModel, sortOps, handleSortModelChange };
};
