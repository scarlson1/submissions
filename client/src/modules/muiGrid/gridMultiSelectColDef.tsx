// import { GRID_STRING_COL_DEF } from './gridStringColDef';
// import { GridSingleSelectColDef, ValueOptions } from '../models/colDef/gridColDef';
// import { renderEditSingleSelectCell } from '../components/cell/GridEditSingleSelectCell';
// import { getGridSingleSelectOperators } from './gridSingleSelectOperators';
// import { isSingleSelectColDef } from '../components/panel/filterPanel/filterPanelUtils';
// import { isObject } from '../utils/utils';

import { GRID_STRING_COL_DEF, GridColDef, GridColTypeDef, ValueOptions } from '@mui/x-data-grid';
import { GridSingleSelectColDef, isObject } from '@mui/x-data-grid/internals';

import { getGridFirestoreMultiSelectOperators } from './operators/gridMultiSelectOperators';
import {
  GridMultiSelectColDef,
  renderEditMultiSelectCell,
} from 'components/GridEditMultiSelectCell';

// SINGLE SELECT UTILS REF: https://github.com/mui/mui-x/blob/master/packages/grid/x-data-grid/src/components/panel/filterPanel/filterPanelUtils.ts

export function isMultiSelectColDef(colDef: GridColDef | null): colDef is GridSingleSelectColDef {
  return colDef?.type === 'multiSelect';
}

const isArrayOfObjects = (options: any): options is Array<Record<string, any>> => {
  return typeof options[0] === 'object';
};

const defaultGetOptionValue = (value: ValueOptions) => {
  return isObject(value) ? value.value : value;
};

const defaultGetOptionLabel = (value: ValueOptions) => {
  return isObject(value) ? value.label : String(value);
};

// CURRENTLY BEING USED AS WORK-AROUND
export const multiSelectExtendsSingle: GridColTypeDef = {
  extendType: 'singleSelect',
  type: 'singleSelect', // get round isSingleSelect check in filter operator input conmponent
  renderEditCell: renderEditMultiSelectCell,
  filterOperators: getGridFirestoreMultiSelectOperators(),
};

// NOT BEING USED
export const GRID_MULTI_SELECT_COL_DEF: Omit<GridMultiSelectColDef, 'field'> = {
  ...GRID_STRING_COL_DEF,
  type: 'multiSelect',
  getOptionLabel: defaultGetOptionLabel,
  getOptionValue: defaultGetOptionValue,
  valueFormatter(params) {
    const { id, field, value, api } = params;
    const colDef = params.api.getColumn(field);

    if (!isMultiSelectColDef(colDef)) {
      return '';
    }

    let valueOptions: Array<ValueOptions>;
    if (typeof colDef.valueOptions === 'function') {
      valueOptions = colDef.valueOptions!({ id, row: id ? api.getRow(id) : null, field });
    } else {
      valueOptions = colDef.valueOptions!;
    }

    if (value == null) {
      return '';
    }

    if (!valueOptions) {
      return value;
    }

    if (!isArrayOfObjects(valueOptions)) {
      return colDef.getOptionLabel!(value);
    }

    const valueOption = valueOptions.find((option) => colDef.getOptionValue!(option) === value);
    return valueOption ? colDef.getOptionLabel!(valueOption) : '';
  },
  renderEditCell: renderEditMultiSelectCell,
  filterOperators: getGridFirestoreMultiSelectOperators(),
  // @ts-ignore
  pastedValueParser: (value, params) => {
    const colDef = params.colDef;
    const colDefValueOptions = (colDef as GridSingleSelectColDef).valueOptions;
    const valueOptions =
      typeof colDefValueOptions === 'function'
        ? colDefValueOptions({ field: colDef.field })
        : colDefValueOptions || [];
    const getOptionValue = (colDef as GridSingleSelectColDef).getOptionValue!;
    const valueOption = valueOptions.find((option) => {
      if (getOptionValue(option) === value) {
        return true;
      }
      return false;
    });
    if (valueOption) {
      return value;
    }
    // do not paste the value if it is not in the valueOptions
    return undefined;
  },
};

// export const multiSelectColumnType: GridColTypeDef = {
//   extendType: 'singleSelect',
//   type: 'multiSelect',
//   filterOperators: getGridFirestoreMultiSelectOperators()
// };
