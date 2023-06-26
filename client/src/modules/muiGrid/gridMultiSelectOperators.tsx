import { GridFilterInputMultipleSingleSelect, GridFilterOperator } from '@mui/x-data-grid';
import { isObject } from '@mui/x-data-grid/internals';

// import { GridFilterInputMultipleMultipleSelect } from 'components';

// gridSingleSelectOperators: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/colDef/gridSingleSelectOperators.ts

const parseObjectValue = (value: unknown) => {
  if (value == null || !isObject<{ value: unknown }>(value)) {
    return value;
  }
  return value.value;
};

export const getGridFirestoreMultiSelectOperators = (): GridFilterOperator[] => [
  {
    label: 'is',
    value: '==',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || filterItem.value === '') {
        return null;
      }
      return ({ value }): boolean => parseObjectValue(value) === parseObjectValue(filterItem.value);
    },
    // TODO: FIX MULTI-SELECT INPUT (or copy below component and remove isSingleSelect type check)
    InputComponent: GridFilterInputMultipleSingleSelect, // GridFilterInputMultipleMultipleSelect, //  GridFilterInputSingleSelect, //
    InputComponentProps: { multiple: true },
  },
  {
    label: 'not in',
    value: 'not-in',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || filterItem.value === '') {
        return null;
      }
      return ({ value }): boolean => parseObjectValue(value) !== parseObjectValue(filterItem.value);
    },
    InputComponent: GridFilterInputMultipleSingleSelect, // GridFilterInputMultipleMultipleSelect, // GridFilterInputMultipleSingleSelect, // GridFilterInputSingleSelect,
    InputComponentProps: { multiple: true },
  },
  // {
  //   label: 'contains',
  //   value: 'array-contains',
  //   getApplyFilterFn: (filterItem) => {
  //     if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
  //       return null;
  //     }
  //     const filterItemValues = filterItem.value.map(parseObjectValue);

  //     return ({ value }): boolean => filterItemValues.includes(parseObjectValue(value));
  //   },
  //   InputComponent: GridFilterInputMultipleMultipleSelect,
  // },
  // {
  //   label: 'is any of',
  //   value: 'array-contains-any',
  //   getApplyFilterFn: (filterItem) => {
  //     if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
  //       return null;
  //     }
  //     const filterItemValues = filterItem.value.map(parseObjectValue);

  //     return ({ value }): boolean => filterItemValues.includes(parseObjectValue(value));
  //   },
  //   InputComponent: GridFilterInputMultipleMultipleSelect,
  // },
];

// {
//   label: 'in',
//   value: 'in',
//   getApplyFilterFn: (filterItem) => {
//     if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
//       return null;
//     }
//     const filterItemValues = filterItem.value.map(parseObjectValue);

//     return ({ value }) => filterItemValues.some((requiredVal) => parseObjectValue(value));
//   },
//   InputComponent: GridFilterInputMultipleSingleSelect,
// },
// {
//   label: 'not in',
//   value: 'not-in',
//   getApplyFilterFn: (filterItem) => {
//     if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
//       return null;
//     }
//     const filterItemValues = filterItem.value.map(parseObjectValue);

//     return ({ value }) => !filterItemValues.some((requiredVal) => parseObjectValue(value));
//   },
//   InputComponent: GridFilterInputMultipleSingleSelect,
// },
