import { GridColDef, GridValueGetterParams } from '@mui/x-data-grid';

import { AGENCY_SUBMISSION_STATUS, AgencyApplication } from 'common';
import {
  addrCityCol,
  addrLine1Col,
  addrLine2Col,
  addrPostalCol,
  addrStateCol,
  addressSummaryCol,
  createdCol,
  emailCol,
  fileLinkCol,
  firstNameCol,
  idCol,
  lastNameCol,
  orgNameCol,
  phoneCol,
  statusCol,
  updatedCol,
} from './gridColumns';

export const agencyAppCols: GridColDef<AgencyApplication>[] = [
  { ...idCol, headerName: 'Doc ID' },
  orgNameCol,
  {
    ...statusCol,
    valueOptions: [
      AGENCY_SUBMISSION_STATUS.ACCEPTED,
      AGENCY_SUBMISSION_STATUS.REJECTED,
      AGENCY_SUBMISSION_STATUS.REVIEW_REQUIRED,
      AGENCY_SUBMISSION_STATUS.SUBMITTED,
    ],
    filterable: true,
  },
  {
    field: 'contact',
    headerName: 'Contact',
    minWidth: 180,
    flex: 1,
    editable: false,
    filterable: false,
    valueGetter: (params) => `${params.row.contact.firstName} ${params.row.contact.lastName}`,
  },
  {
    ...firstNameCol,
    field: 'contact.firstName',
    headerName: 'Contact First Name',
    valueGetter: (params: GridValueGetterParams<any, any>) => params.row.contact?.firstName || null,
  },
  {
    ...lastNameCol,
    field: 'contact.lastName',
    headerName: 'Contact Last Name',
    valueGetter: (params) => params.row.contact?.lastName || null,
  },
  {
    ...emailCol,
    field: 'contact.email',
    headerName: 'Contact Email',
    valueGetter: (params) => params.row.contact?.email || null,
  },
  {
    ...phoneCol,
    field: 'contact.phone',
    headerName: 'Contact Phone',
    valueGetter: (params) => params.row.contact?.phone || null,
  },
  addressSummaryCol,
  addrLine1Col,
  addrLine2Col,
  addrCityCol,
  addrStateCol,
  addrPostalCol,
  {
    ...fileLinkCol,
    field: 'EandO',
    headerName: 'E & O',
  },
  {
    field: 'FEIN',
    headerName: 'FEIN',
    minWidth: 120,
    flex: 1,
    editable: false,
  },
  createdCol,
  updatedCol,
];
