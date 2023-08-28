import { GridColDef } from '@mui/x-data-grid';

import { CHANGE_REQUEST_STATUS } from 'common';
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

const changes: GridColDef = {
  field: 'changes',
  headerName: 'Requested Changes',
  minWidth: 200,
  flex: 1.2,
  editable: false,
  filterable: false,
  sortable: false,
  valueGetter: (params) => {
    return params.value ? JSON.stringify(params.value) : null;
  },
};

const processedByUserIdCol: GridColDef = {
  ...idCol,
  field: 'processedByUserId',
  headerName: 'Processed By UID',
};

export const changeRequestCols: GridColDef[] = [
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
  changes,
  userIdCol,
  processedByUserIdCol,
  errMsgCol,
  createdCol,
  updatedCol,
];
