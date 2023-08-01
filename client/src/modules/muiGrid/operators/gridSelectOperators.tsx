import {
  GridFilterOperator,
  GridFilterInputSingleSelect,
  GridFilterInputMultipleSingleSelect,
} from '@mui/x-data-grid';

// gridSingleSelectOperators: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/colDef/gridSingleSelectOperators.ts

export function isObject<TObject = Record<PropertyKey, any>>(value: unknown): value is TObject {
  return typeof value === 'object' && value !== null;
}

const parseObjectValue = (value: unknown) => {
  if (value == null || !isObject<{ value: unknown }>(value)) {
    return value;
  }
  return value.value;
};

export const getGridFirestoreSelectOperators = (): GridFilterOperator[] => [
  {
    label: 'is',
    value: '==',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || filterItem.value === '') {
        return null;
      }
      return ({ value }): boolean => parseObjectValue(value) === parseObjectValue(filterItem.value);
    },
    InputComponent: GridFilterInputSingleSelect,
  },
  {
    label: 'not',
    value: '!=',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || filterItem.value === '') {
        return null;
      }
      return ({ value }): boolean => parseObjectValue(value) !== parseObjectValue(filterItem.value);
    },
    InputComponent: GridFilterInputSingleSelect,
  },
  {
    label: 'is any of',
    value: 'array-contains-any',
    getApplyFilterFn: (filterItem) => {
      if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
        return null;
      }
      const filterItemValues = filterItem.value.map(parseObjectValue);

      return ({ value }): boolean => filterItemValues.includes(parseObjectValue(value));
    },
    InputComponent: GridFilterInputMultipleSingleSelect,
  },
  {
    label: 'in',
    value: 'in',
    getApplyFilterFn: (filterItem) => {
      if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
        return null;
      }
      const filterItemValues = filterItem.value.map(parseObjectValue);

      return ({ value }) =>
        filterItemValues.some((requiredVal) => parseObjectValue(value) === requiredVal);
    },
    InputComponent: GridFilterInputMultipleSingleSelect,
  },
  {
    label: 'not in',
    value: 'not-in',
    getApplyFilterFn: (filterItem) => {
      if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
        return null;
      }
      const filterItemValues = filterItem.value.map(parseObjectValue);

      return ({ value }) =>
        filterItemValues.every((requiredVal) => parseObjectValue(value) !== requiredVal);
    },
    InputComponent: GridFilterInputMultipleSingleSelect,
  },
];
