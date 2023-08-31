import { GridColDef } from '@mui/x-data-grid';

import { policyCols } from './policyCols';
import { firstNameCol, idCol, targetCollectionCol, statusCol } from './gridColumns';
import { transactionCols } from './transactionCols';
import { quoteCols } from './quoteCols';

export const importStagingMetaCols: GridColDef[] = [
  {
    ...statusCol,
    field: 'importMeta.status',
    headerName: 'Import Status',
    valueOptions: ['imported', 'new', 'declined'],
    valueGetter: (params) => params.row.importMeta?.status || null,
  },
  {
    ...targetCollectionCol,
    field: 'importMeta.targetCollection',
    headerName: 'Collection',
    type: 'singleSelect',
    valueGetter: (params) => params.row.importMeta?.targetCollection || null,
  },
  {
    ...firstNameCol,
    field: 'importMeta.reviewBy.name',
    headerName: 'Import Reviewed By',
    valueGetter: (params) => params.row.importMeta?.reviewBy?.name || null,
  },
  {
    ...idCol,
    field: 'importMeta.reviewBy.userId',
    headerName: 'Reviewed By User ID',
    valueGetter: (params) => params.row.importMeta?.reviewBy?.userId || null,
  },
];

export const policyStagingRecordCols: GridColDef[] = [...importStagingMetaCols, ...policyCols];

export const transactionStagingRecordCols: GridColDef[] = [
  ...importStagingMetaCols,
  ...transactionCols,
];

export const quoteStagingRecordCols: GridColDef[] = [...importStagingMetaCols, ...quoteCols];
