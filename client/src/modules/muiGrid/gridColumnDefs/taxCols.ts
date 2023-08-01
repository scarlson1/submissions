import { GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';

import {
  LOBCol,
  booleanCalcActiveCol,
  createdCol,
  effectiveDateCol,
  expirationDateCol,
  idCol,
  policyTrxTypesCol,
  productsCol,
  stateCol,
  subjectBaseCol,
  updatedCol,
} from './gridColumns';
import { formatGridCurrency, formatGridPercent } from 'modules/utils';
import { renderFormattedValue } from 'components/RenderGridCellHelpers';

export const taxCols: GridColDef[] = [
  idCol,
  productsCol,
  stateCol,
  {
    field: 'displayName',
    headerName: 'Display Name',
    minWidth: 160,
    flex: 0.8,
    editable: false,
  },
  booleanCalcActiveCol,
  effectiveDateCol,
  expirationDateCol,
  {
    field: 'rate',
    headerName: 'Rate',
    description:
      'Percentage rate (0.01 = 1%) applied to the sum of the fields in subject base, or a fixed rate for fixed dollar taxes',
    minWidth: 80,
    flex: 0.6,
    headerAlign: 'center',
    align: 'right',
    editable: false,
    valueGetter: (params) => params.row.rate || null,
    valueFormatter: (params: GridValueFormatterParams<number>) => {
      if (params.value > 0.15) return formatGridCurrency(params);
      return formatGridPercent(params, 2);
    },
    renderCell: renderFormattedValue,
  },
  subjectBaseCol,
  policyTrxTypesCol,
  LOBCol,
  {
    field: 'baseRoundType',
    headerName: 'Base Round',
    type: 'number',
    minWidth: 100,
    flex: 0.6,
    editable: false,
    filterable: false,
  },
  {
    field: 'baseDigits',
    headerName: 'Base Digits',
    type: 'number',
    minWidth: 100,
    flex: 0.6,
    headerAlign: 'center',
    align: 'right',
    editable: false,
    filterable: false,
  },
  {
    field: 'resultRoundType',
    headerName: 'Result Round',
    type: 'number',
    minWidth: 100,
    flex: 0.6,
    editable: false,
    filterable: false,
  },
  {
    field: 'resultDigits',
    headerName: 'Result Round',
    type: 'number',
    minWidth: 100,
    flex: 0.6,
    headerAlign: 'center',
    align: 'right',
    editable: false,
    filterable: false,
  },
  {
    field: 'refundable',
    headerName: 'Refundable',
    type: 'boolean',
    minWidth: 100,
    flex: 0.6,
    editable: false,
  },
  createdCol,
  updatedCol,
];
