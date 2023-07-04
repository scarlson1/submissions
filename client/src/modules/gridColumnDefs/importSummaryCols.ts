import { GridColDef } from '@mui/x-data-grid';

import {
  createdCol,
  idCol,
  importCollectionCol,
  importCreationErrorsCountCol,
  importDocIdsCol,
  importDocIdsCountCol,
  invalidRowsCol,
} from 'common';

export const importSummaryCols: GridColDef[] = [
  importCollectionCol,
  importDocIdsCol,
  importDocIdsCountCol,
  importCreationErrorsCountCol,
  invalidRowsCol,
  createdCol,
  { ...idCol, headerName: 'Import Doc ID' },
];
