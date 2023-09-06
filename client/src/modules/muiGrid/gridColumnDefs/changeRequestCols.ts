import { GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

import { CHANGE_REQUEST_STATUS, ChangeRequest } from 'common';
import {
  createdCol,
  errMsgCol,
  idCol,
  locationIdCol,
  policyIdCol,
  requestEffDateCol,
  scopeCol,
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
    valueOptions: [
      CHANGE_REQUEST_STATUS.SUBMITTED,
      CHANGE_REQUEST_STATUS.ACCEPTED,
      CHANGE_REQUEST_STATUS.DENIED,
      CHANGE_REQUEST_STATUS.UNDER_REVIEW,
      CHANGE_REQUEST_STATUS.CANCELLED,
      CHANGE_REQUEST_STATUS.DRAFT,
    ],
  },
  scopeCol,
  requestEffDateCol,
  policyIdCol,
  locationIdCol,
  locationChangesCol,
  policyChangesCol,
  userIdCol,
  processedByUserIdCol,
  errMsgCol,
  createdCol,
  updatedCol,
];
