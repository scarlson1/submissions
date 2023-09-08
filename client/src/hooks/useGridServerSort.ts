import { GridInitialState, GridSortModel } from '@mui/x-data-grid';
import { QueryOrderByConstraint, orderBy } from 'firebase/firestore';
import { isEqual } from 'lodash';
import { startTransition, useCallback, useEffect, useRef, useState } from 'react';

import { usePrevious } from 'hooks/utils';
import { getFirestoreSortOps } from 'modules/muiGrid';

export const useGridServerSort = (
  initialState?: GridInitialState | undefined,
  resetCursors?: () => void
) => {
  const [sortModel, setSortModel] = useState<GridSortModel>(initialState?.sorting?.sortModel || []);

  const sortOps = useRef<QueryOrderByConstraint[]>([
    ...getFirestoreSortOps(initialState?.sorting?.sortModel),
  ]);

  const prevModel = usePrevious(sortModel);

  useEffect(() => {
    if (resetCursors && prevModel && !isEqual(sortModel, prevModel)) {
      console.log('RESET CURSORS (SORT DIFF)');
      resetCursors();
    }
  }, [resetCursors, sortModel, prevModel]);

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
