import { GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

import type { ChangeRequest } from '@idemand/common';
import { ChangeRequestStatus } from 'common/enums';
import {
  createdCol,
  errMsgCol,
  idCol,
  locationIdCol,
  policyIdCol,
  requestEffDateCol,
  statusCol,
  trxTypeCol,
  updatedCol,
  userIdCol,
} from './gridColumns';

const locationChangesCol: GridColDef<ChangeRequest> = {
  field: 'locationChanges',
  headerName: 'Requested Location Changes',
  minWidth: 200,
  flex: 1.2,
  editable: false,
  filterable: false,
  sortable: false,
  valueGetter: (params: GridValueGetterParams<ChangeRequest>) => {
    return params.value ? JSON.stringify(params.value) : null;
  },
};
const policyChangesCol: GridColDef<ChangeRequest> = {
  field: 'policyChanges',
  headerName: 'Requested Policy Changes',
  minWidth: 200,
  flex: 1.2,
  editable: false,
  filterable: false,
  sortable: false,
  valueGetter: (params: GridValueGetterParams<ChangeRequest>) => {
    return params.value ? JSON.stringify(params.value) : null;
  },
};

const processedByUserIdCol: GridColDef = {
  ...idCol,
  field: 'processedByUserId',
  headerName: 'Processed By UID',
};

export const changeRequestCols: GridColDef<ChangeRequest>[] = [
  idCol,
  trxTypeCol,
  {
    ...statusCol,
    filterable: true,
    editable: true,
    valueOptions: ChangeRequestStatus.options,
  },
  // scopeCol,
  requestEffDateCol,
  policyIdCol,
  locationIdCol,
  locationChangesCol,
  policyChangesCol,
  { ...userIdCol, sortable: false, filterable: false },
  { ...processedByUserIdCol, sortable: false, filterable: false },
  errMsgCol,
  createdCol,
  updatedCol,
];
