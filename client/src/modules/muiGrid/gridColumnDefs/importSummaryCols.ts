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
import { ImportSummary } from 'common';

export const importSummaryCols: GridColDef<ImportSummary>[] = [
  targetCollectionCol,
  importDocIdsCol,
  importDocIdsCountCol,
  importCreationErrorsCountCol,
  invalidRowsCol,
  createdCol,
  { ...idCol, headerName: 'Import Doc ID' },
];
