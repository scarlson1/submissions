// import { Box } from '@mui/material';
import {
  GridCellParams,
  GridFilterInputMultipleValue,
  GridFilterInputValue,
  GridFilterItem,
  GridFilterOperator,
} from '@mui/x-data-grid';
import { escapeRegExp } from '@mui/x-data-grid/utils/utils';

export const getGridStringQuickFilterFn = (value: any) => {
  if (!value) {
    return null;
  }
  const filterRegex = new RegExp(escapeRegExp(value), 'i');
  return ({ formattedValue: columnValue }: GridCellParams): boolean => {
    return columnValue != null ? filterRegex.test(columnValue.toString()) : false;
  };
};

export const getGridFirestoreStringOperators = (
  disableTrim: boolean = false
): GridFilterOperator<any, number | string | null, any>[] => [
  {
    label: 'equals',
    value: '==',
    getApplyFilterFn: (filterItem: GridFilterItem) => {
      if (!filterItem.value) {
        return null;
      }
      const filterItemValue = disableTrim ? filterItem.value : filterItem.value.trim();

      const collator = new Intl.Collator(undefined, { sensitivity: 'base', usage: 'search' });
      return ({ value }): boolean => {
        return value != null ? collator.compare(filterItemValue, value.toString()) === 0 : false;
      };
    },
    InputComponent: GridFilterInputValue,
  },
  // NO VALUE INPUT REQUIRED --> DEFAULT TO FALSE IN WHERE QUERY
  {
    label: 'is not empty',
    value: '!=',
    getApplyFilterFn: () => {
      return ({ value }): boolean => {
        return value !== '' && value != null;
      };
    },
    requiresFilterValue: false,
  },
  {
    label: 'is Any Of',
    value: 'in',
    getApplyFilterFn: (filterItem: GridFilterItem) => {
      if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
        return null;
      }
      const filterItemValue = disableTrim
        ? filterItem.value
        : filterItem.value.map((val) => val.trim());
      const collator = new Intl.Collator(undefined, { sensitivity: 'base', usage: 'search' });

      return ({ value }): boolean =>
        value != null
          ? filterItemValue.some((filterValue: GridFilterItem['value']) => {
              return collator.compare(filterValue, value.toString() || '') === 0;
            })
          : false;
    },
    InputComponent: GridFilterInputMultipleValue,
  },
];

// DOESN'T HAVE EQUIVALENT WHERE OP IN FIRESTORE
// {
//   value: 'contains',
//   getApplyFilterFn: (filterItem: GridFilterItem) => {
//     if (!filterItem.value) {
//       return null;
//     }
//     const filterItemValue = disableTrim ? filterItem.value : filterItem.value.trim();

//     const filterRegex = new RegExp(escapeRegExp(filterItemValue), 'i');

//     return ({ value }): boolean => {
//       return value != null ? filterRegex.test(value.toString()) : false;
//     };
//   },
//   InputComponent: GridFilterInputValue,
// },

// {
//   value: 'startsWith',
//   getApplyFilterFn: (filterItem: GridFilterItem) => {
//     if (!filterItem.value) {
//       return null;
//     }
//     const filterItemValue = disableTrim ? filterItem.value : filterItem.value.trim();

//     const filterRegex = new RegExp(`^${escapeRegExp(filterItemValue)}.*$`, 'i');
//     return ({ value }): boolean => {
//       return value != null ? filterRegex.test(value.toString()) : false;
//     };
//   },
//   InputComponent: GridFilterInputValue,
// },
// {
//   value: 'endsWith',
//   getApplyFilterFn: (filterItem: GridFilterItem) => {
//     if (!filterItem.value) {
//       return null;
//     }
//     const filterItemValue = disableTrim ? filterItem.value : filterItem.value.trim();

//     const filterRegex = new RegExp(`.*${escapeRegExp(filterItemValue)}$`, 'i');
//     return ({ value }): boolean => {
//       return value != null ? filterRegex.test(value.toString()) : false;
//     };
//   },
//   InputComponent: GridFilterInputValue,
// },

// NO VALUE INPUT REQUIRED --> DEFAULT TO FALSE IN WHERE QUERY
// {
//   label: 'is empty',
//   value: '!=',
//   getApplyFilterFn: () => {
//     return ({ value }): boolean => {
//       return value === '' || value == null;
//     };
//   },
//   requiresFilterValue: false,
// },
