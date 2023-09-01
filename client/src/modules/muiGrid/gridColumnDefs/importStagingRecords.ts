import { GridColDef } from '@mui/x-data-grid';

import { policyCols } from './policyCols';
import { firstNameCol, idCol, targetCollectionCol, statusCol } from './gridColumns';
import { transactionCols } from './transactionCols';
import { quoteCols } from './quoteCols';
import {
  StagedPolicyImport,
  StagedQuoteImport,
  StagedTransactionImport,
  PolicyImportMeta,
  TransactionsImportMeta,
  QuoteImportMeta,
} from 'common';

export const importStagingMetaCols: GridColDef<{
  importMeta: PolicyImportMeta | QuoteImportMeta | TransactionsImportMeta;
}>[] = [
  {
    ...targetCollectionCol,
    field: 'importMeta.targetCollection',
    valueGetter: (params) => params.row.importMeta?.targetCollection || null,
  },
  {
    ...statusCol,
    field: 'importMeta.status',
    headerName: 'Import Status',
    valueOptions: ['imported', 'new', 'declined'],
    valueGetter: (params) => params.row.importMeta?.status || null,
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

export const policyStagingRecordCols: GridColDef<StagedPolicyImport>[] = [
  ...importStagingMetaCols, // as unknown as GridColDef<{importMeta: PolicyImportMeta }>[],
  // ...policyImportMetaCols,
  ...policyCols,
] as GridColDef<StagedPolicyImport>[];

export const transactionStagingRecordCols: GridColDef<StagedTransactionImport>[] = [
  ...importStagingMetaCols,
  ...transactionCols,
] as GridColDef<StagedTransactionImport>[];

export const quoteStagingRecordCols: GridColDef<StagedQuoteImport>[] = [
  ...importStagingMetaCols,
  ...quoteCols,
] as GridColDef<StagedQuoteImport>[];
