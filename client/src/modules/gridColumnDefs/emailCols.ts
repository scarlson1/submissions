import { GridColDef } from '@mui/x-data-grid';

import {
  createdCol,
  emailCol,
  emailTypeCol,
  idCol,
  ipCol,
  sendgridEventCol,
  sendgridMsgIdCol,
} from './gridColumns';

export const emailCols: GridColDef[] = [
  idCol,
  emailCol,
  sendgridEventCol,
  emailTypeCol,
  sendgridMsgIdCol,
  ipCol,
  createdCol,
];
