import { GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';

import { renderFormattedValue } from 'components/RenderGridCellHelpers';
import { dollarFormat2, percentFormat } from 'modules/utils';
import {
  LOBCol,
  booleanCalcActiveCol,
  createdCol,
  effectiveDateCol,
  expirationDateCol,
  idCol,
  percentColBaseProps,
  policyTrxTypesCol,
  productsCol,
  stateCol,
  subjectBaseCol,
  updatedCol,
} from './gridColumns';

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
    ...percentColBaseProps,
    field: 'rate',
    headerName: 'Rate',
    description:
      'Percentage rate (0.01 = 1%) applied to the sum of the fields in subject base, or a fixed rate for fixed dollar taxes',
    minWidth: 80,
    flex: 0.6,
    editable: false,
    valueGetter: (params) => params.row.rate || null,
    valueFormatter: ({ value }: GridValueFormatterParams<number>) => {
      if (!value && value !== 0) return null;

      if (value > 0.15) return dollarFormat2(value);
      return percentFormat(value, 2);
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
