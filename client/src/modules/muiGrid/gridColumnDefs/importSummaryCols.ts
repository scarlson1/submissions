import { GridColDef } from '@mui/x-data-grid';

import {
  createdCol,
  idCol,
  targetCollectionCol,
  importCreationErrorsCountCol,
  importDocIdsCol,
  importDocIdsCountCol,
  invalidRowsCol,
} from './gridColumns';

export const importSummaryCols: GridColDef[] = [
  targetCollectionCol,
  importDocIdsCol,
  importDocIdsCountCol,
  importCreationErrorsCountCol,
  invalidRowsCol,
  createdCol,
  { ...idCol, headerName: 'Import Doc ID' },
];
