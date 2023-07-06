import { GridColDef } from '@mui/x-data-grid';

import {
  createdCol,
  displayNameCol,
  emailCol,
  firstNameCol,
  idCol,
  lastNameCol,
  orgIdCol,
  phoneCol,
  updatedCol,
} from './gridColumns';

export const userCols: GridColDef[] = [
  displayNameCol,
  firstNameCol,
  lastNameCol,
  emailCol,
  phoneCol,
  createdCol,
  updatedCol,
  {
    ...idCol,
    headerName: 'User ID',
  },
  orgIdCol,
];
