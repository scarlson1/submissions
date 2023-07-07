import { GridColDef } from '@mui/x-data-grid';

import {
  createdCol,
  emailCol,
  idCol,
  ipCol,
  sendgridEventCol,
  sendgridMsgIdCol,
} from './gridColumns';

export const emailCols: GridColDef[] = [
  idCol,
  emailCol,
  sendgridEventCol,
  sendgridMsgIdCol,
  ipCol,
  createdCol,
];
