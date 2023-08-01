import {
  GridCellParams,
  // GridFilterInputMultipleValue,
  // GridFilterInputValue,
  GridFilterOperator,
} from '@mui/x-data-grid';
import { NumericFormat } from 'react-number-format';

import { GridFilterInputValue } from 'components/GridFilterInputValue';
import { DollarMask } from 'components/forms/FormikDollarMaskField';

const parseNumericValue = (value: unknown) => {
  if (value == null) {
    return null;
  }

  return Number(value);
};

export const getGridNumericQuickFilterFn = (value: any) => {
  if (value == null || Number.isNaN(value) || value === '') {
    return null;
  }

  return ({ value: columnValue }: GridCellParams): boolean => {
    return parseNumericValue(columnValue) === parseNumericValue(value);
  };
};

export const getGridFirestoreNumericOperators = (): GridFilterOperator<
  any,
  number | string | null,
  any
>[] => [
  {
    label: 'equals',
    value: '==',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || Number.isNaN(filterItem.value)) {
        return null;
      }

      return ({ value }): boolean => {
        return parseNumericValue(value) === filterItem.value;
      };
    },
    InputComponent: GridFilterInputValue,
    InputComponentProps: {
      // type: 'number',
      convertToNumber: true,
      InputProps: {
        inputComponent: DollarMask as any,
        inputProps: {
          component: NumericFormat,
          // decimalScale: 0,
          // allowNegative: false,
        },
      },
    },
  },
  {
    label: 'not equal',
    value: '!=',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || Number.isNaN(filterItem.value)) {
        return null;
      }

      return ({ value }): boolean => {
        return parseNumericValue(value) !== filterItem.value;
      };
    },
    InputComponent: GridFilterInputValue,
    InputComponentProps: {
      convertToNumber: true,
      InputProps: {
        inputComponent: DollarMask as any,
        inputProps: {
          component: NumericFormat,
        },
      },
    },
  },
  {
    label: 'greater than',
    value: '>',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || Number.isNaN(filterItem.value)) {
        return null;
      }

      return ({ value }): boolean => {
        if (value == null) {
          return false;
        }

        return parseNumericValue(value)! > filterItem.value;
      };
    },
    InputComponent: GridFilterInputValue,
    InputComponentProps: {
      convertToNumber: true,
      InputProps: {
        inputComponent: DollarMask as any,
        inputProps: {
          component: NumericFormat,
        },
      },
    },
  },
  {
    label: 'greater or equal to',
    value: '>=',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || Number.isNaN(filterItem.value)) {
        return null;
      }

      return ({ value }): boolean => {
        if (value == null) {
          return false;
        }

        return parseNumericValue(value)! >= filterItem.value;
      };
    },
    InputComponent: GridFilterInputValue,
    InputComponentProps: {
      convertToNumber: true,
      inputProps: {
        inputComponent: DollarMask as any,
        inputProps: {
          component: NumericFormat,
        },
      },
    },
  },
  {
    label: 'less than',
    value: '<',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || Number.isNaN(filterItem.value)) {
        return null;
      }

      return ({ value }): boolean => {
        if (value == null) {
          return false;
        }

        return parseNumericValue(value)! < filterItem.value;
      };
    },
    InputComponent: GridFilterInputValue,
    InputComponentProps: {
      convertToNumber: true,
      InputProps: {
        inputComponent: DollarMask as any,
        inputProps: {
          component: NumericFormat,
        },
      },
    },
  },
  {
    label: 'less or equal to',
    value: '<=',
    getApplyFilterFn: (filterItem) => {
      if (filterItem.value == null || Number.isNaN(filterItem.value)) {
        return null;
      }

      return ({ value }): boolean => {
        if (value == null) {
          return false;
        }

        return parseNumericValue(value)! <= filterItem.value;
      };
    },
    // InputComponent: GridFilterInputValue,
    // InputComponentProps: { type: 'number' },
    InputComponent: GridFilterInputValue,
    InputComponentProps: {
      convertToNumber: true,
      InputProps: {
        inputComponent: DollarMask as any,
        inputProps: {
          component: NumericFormat,
        },
      },
    },
  },
  // TODO: fix GridFilterInputMultipleValue component then uncomment
  // {
  //   label: 'is any of',
  //   value: 'in',
  //   getApplyFilterFn: (filterItem) => {
  //     if (!Array.isArray(filterItem.value) || filterItem.value.length === 0) {
  //       return null;
  //     }

  //     return ({ value }): boolean => {
  //       return value != null && filterItem.value.includes(Number(value));
  //     };
  //   },
  //   // InputComponent: GridFilterInputMultipleValue,
  //   // InputComponentProps: { type: 'number' },
  //   InputComponent: GridFilterInputMultipleValue,
  //   // InputComponentProps: {
  //   //   convertToNumber: true,
  //   //   InputProps: {
  //   //     inputComponent: DollarMask as any,
  //   //     inputProps: {
  //   //       component: NumericFormat,
  //   //     },
  //   //   },
  //   // },
  // },
];
