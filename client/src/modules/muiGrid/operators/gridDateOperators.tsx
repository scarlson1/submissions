import {
  GridCellParams,
  // GridFilterInputDate,
  GridFilterItem,
  GridFilterOperator,
} from '@mui/x-data-grid';

import { GridFilterDateInput } from 'components/GridFilterDateInput';

const dateRegex = /(\d+)-(\d+)-(\d+)/;
const dateTimeRegex = /(\d+)-(\d+)-(\d+)T(\d+):(\d+)/;

function buildApplyFilterFn(
  filterItem: GridFilterItem,
  compareFn: (value1: number, value2: number) => boolean,
  showTime?: boolean,
  keepHours?: boolean
) {
  if (!filterItem.value) {
    return null;
  }

  const [year, month, day, hour, minute] = filterItem.value
    .match(showTime ? dateTimeRegex : dateRegex)!
    .slice(1)
    .map(Number);

  const time = new Date(year, month - 1, day, hour || 0, minute || 0).getTime();

  return ({ value }: GridCellParams<any, Date, any>): boolean => {
    if (!value) {
      return false;
    }

    if (keepHours) {
      return compareFn(value.getTime(), time);
    }

    // Make a copy of the date to not reset the hours in the original object
    const dateCopy = new Date(value);
    const timeToCompare = dateCopy.setHours(
      showTime ? value.getHours() : 0,
      showTime ? value.getMinutes() : 0,
      0,
      0
    );
    return compareFn(timeToCompare, time);
  };
}

export const getGridFirestoreDateOperators = (
  showTime?: boolean
): GridFilterOperator<any, Date, any>[] => [
  {
    label: 'is',
    value: '==',
    getApplyFilterFn: (filterItem) => {
      return buildApplyFilterFn(filterItem, (value1, value2) => value1 === value2, showTime);
    },
    InputComponent: GridFilterDateInput,
    InputComponentProps: { type: showTime ? 'datetime-local' : 'date' },
  },
  {
    label: 'not',
    value: '!=',
    getApplyFilterFn: (filterItem) => {
      return buildApplyFilterFn(filterItem, (value1, value2) => value1 !== value2, showTime);
    },
    InputComponent: GridFilterDateInput,
    InputComponentProps: { type: showTime ? 'datetime-local' : 'date' },
  },
  {
    label: 'after',
    value: '>',
    getApplyFilterFn: (filterItem) => {
      return buildApplyFilterFn(filterItem, (value1, value2) => value1 > value2, showTime);
    },
    InputComponent: GridFilterDateInput,
    InputComponentProps: { type: showTime ? 'datetime-local' : 'date' },
  },
  {
    label: 'on or after',
    value: '>=',
    getApplyFilterFn: (filterItem) => {
      return buildApplyFilterFn(filterItem, (value1, value2) => value1 >= value2, showTime);
    },
    InputComponent: GridFilterDateInput,
    InputComponentProps: { type: showTime ? 'datetime-local' : 'date' },
  },
  {
    label: 'before',
    value: '<',
    getApplyFilterFn: (filterItem) => {
      return buildApplyFilterFn(
        filterItem,
        (value1, value2) => value1 < value2,
        showTime,
        !showTime
      );
    },
    InputComponent: GridFilterDateInput,
    InputComponentProps: { type: showTime ? 'datetime-local' : 'date' },
  },
  {
    label: 'on or before',
    value: '<=',
    getApplyFilterFn: (filterItem) => {
      return buildApplyFilterFn(filterItem, (value1, value2) => value1 <= value2, showTime);
    },
    InputComponent: GridFilterDateInput,
    InputComponentProps: { type: showTime ? 'datetime-local' : 'date' },
  },
  // TODO: uncomment --> isEmpty = ?? 'in' [null, ''] ??
  // {
  //   label: 'is empty',
  //   value: 'isEmpty',
  //   getApplyFilterFn: () => {
  //     return ({ value }): boolean => {
  //       return value == null;
  //     };
  //   },
  //   requiresFilterValue: false,
  // },
  // TODO: uncomment --> isNotEmpty = where(field, '!=', false) = field exists with something other than false or null
  // {
  //   value: 'isNotEmpty',
  //   getApplyFilterFn: () => {
  //     return ({ value }): boolean => {
  //       return value != null;
  //     };
  //   },
  //   requiresFilterValue: false,
  // },
];
