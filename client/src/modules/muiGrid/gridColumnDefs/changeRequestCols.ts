import { GridColDef } from '@mui/x-data-grid';

import {
  idCol,
  createdCol,
  updatedCol,
  trxTypeCol,
  requestEffDateCol,
  locationIdCol,
  policyIdCol,
  userIdCol,
  statusCol,
} from './gridColumns';
import { CHANGE_REQUEST_STATUS } from 'common';

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

const approvedByUserIdCol: GridColDef = {
  ...idCol,
  field: 'approvedByUserId',
  headerName: 'Approved By UID',
};

export const changeRequestCols: GridColDef[] = [
  idCol,
  trxTypeCol,
  {
    ...statusCol,
    filterable: true,
    valueOptions: [
      CHANGE_REQUEST_STATUS.SUBMITTED,
      CHANGE_REQUEST_STATUS.ACCEPTED,
      CHANGE_REQUEST_STATUS.DENIED,
      CHANGE_REQUEST_STATUS.UNDER_REVIEW,
      CHANGE_REQUEST_STATUS.CANCELLED,
    ],
  },
  requestEffDateCol,
  policyIdCol,
  locationIdCol,
  changes,
  userIdCol,
  approvedByUserIdCol,
  createdCol,
  updatedCol,
];
