import { GridColDef } from '@mui/x-data-grid';

import {
  booleanCalcActiveCol,
  createdCol,
  effectiveDateCol,
  expirationDateCol,
  idCol,
  updatedCol,
} from './gridColumns';
import { renderChips } from 'components/RenderGridCellHelpers';
import { Timestamp } from 'firebase/firestore';
import { formatGridFirestoreTimestampAsDate } from 'modules/utils';
import { Moratorium } from 'common';

export const moratoriumCols: GridColDef<Moratorium>[] = [
  booleanCalcActiveCol,
  {
    field: 'locations',
    headerName: 'FIPS',
    minWidth: 200,
    flex: 1,
    editable: false,
  },
  {
    field: 'locationDetails',
    headerName: 'Counties',
    minWidth: 280,
    flex: 1,
    editable: false,
    valueGetter: (params) => {
      const ld = params.row.locationDetails;
      if (ld) return ld.map((l: any) => l.countyName);
      return [];
    },
    renderCell: renderChips,
  },
  {
    field: 'count',
    headerName: 'Count',
    description: 'Total count of counties included in moratorium',
    minWidth: 100,
    flex: 1,
    editable: false,
    headerAlign: 'center',
    align: 'right',
    valueGetter: (params) => params.row.locations.length || null,
  },
  {
    ...effectiveDateCol,
    valueSetter: (params) => {
      let newVal = params.value instanceof Date ? Timestamp.fromDate(params.value) : params.value;
      return { ...params.row, effectiveDate: newVal };
    },
    valueFormatter: formatGridFirestoreTimestampAsDate,
  },
  {
    ...expirationDateCol,
    valueSetter: (params) => {
      let newVal = params.value instanceof Date ? Timestamp.fromDate(params.value) : params.value;
      return { ...params.row, expirationDate: newVal };
    },
    valueFormatter: formatGridFirestoreTimestampAsDate,
  },
  createdCol,
  updatedCol,
  {
    ...idCol,
    headerName: 'Doc ID',
  },
];
