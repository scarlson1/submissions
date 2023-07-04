import { GridFilterItem, GridFilterOperator } from '@mui/x-data-grid';

import { GridFilterInputBoolean } from './gridFilterInputBoolean';

export const getGridFirestoreBooleanOperators = (): GridFilterOperator<
  any,
  boolean | null,
  any
>[] => [
  {
    label: 'is',
    value: '==',
    getApplyFilterFn: (filterItem: GridFilterItem) => {
      if (!filterItem.value) {
        return null;
      }

      const valueAsBoolean = filterItem.value === 'true';
      return ({ value }): boolean => {
        return Boolean(value) === valueAsBoolean;
      };
    },
    InputComponent: GridFilterInputBoolean,
  },
];
