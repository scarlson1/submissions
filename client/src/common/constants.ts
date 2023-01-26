// import { GridColDef } from '@mui/x-data-grid';
import { ProviderId } from 'firebase/auth';
// import { renderGridEmail } from 'components/RenderGridCellHelpers';

export const SUPPORTED_AUTH_PROVIDER_IDS = [
  ProviderId.PASSWORD,
  ProviderId.GOOGLE,
  'microsoft.com',
  ProviderId.PHONE,
];

export const ACTIVE_STATES = [
  'Arizona',
  'Connecticut',
  'Florida',
  'Idaho',
  'Louisiana',
  'Maryland',
  'Michigan',
  'Minnesota',
  'Montana',
  'Oklahoma',
  'Pennsylvania',
  'Texas',
  'Virginia',
  'Wisconsin',
  'West Virginia',
];

export const ACTIVE_STATES_ABRV = [
  'AZ',
  'CT',
  'FL',
  'ID',
  'LA',
  'MD',
  'MI',
  'MN',
  'MT',
  'OK',
  'PA',
  'TX',
  'VA',
  'WI',
  'WV',
];

// export const additionInsuredColumns: GridColDef[] = [
//   { field: 'id', headerName: 'ID', width: 120 },
//   {
//     field: 'name',
//     headerName: 'Name',
//     flex: 1,
//     minWidth: 180,
//     editable: false,
//   },
//   {
//     field: 'email',
//     headerName: 'Email',
//     flex: 1,
//     minWidth: 180,
//     editable: false,
//     renderCell: (params) => renderGridEmail(params),
//   },
//   {
//     field: 'relation',
//     headerName: 'Relation',
//     flex: 1,
//     minWidth: 180,
//     editable: false,
//   },
// ];

// export const mortgageeInterestColumns: GridColDef[] = [
//   { field: 'id', headerName: 'ID', width: 120 },
//   {
//     field: 'company',
//     headerName: 'Company',
//     flex: 1,
//     minWidth: 180,
//     editable: false,
//   },
//   {
//     field: 'contactName',
//     headerName: 'Contact',
//     flex: 1,
//     minWidth: 180,
//     editable: false,
//   },
//   {
//     field: 'contactEmail',
//     headerName: 'Email',
//     flex: 1,
//     minWidth: 180,
//     editable: false,
//     renderCell: (params) => renderGridEmail(params),
//   },
//   {
//     field: 'loanNumber',
//     headerName: 'Loan #',
//     flex: 1,
//     minWidth: 180,
//     editable: false,
//   },
//   {
//     field: 'priority',
//     headerName: 'Priority',
//     flex: 1,
//     minWidth: 80,
//     editable: false,
//   },
// ];
