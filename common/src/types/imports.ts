import type { Timestamp } from './common.js';
import type { Policy } from './policy.js';
import type { Quote } from './quote.js';
import type { Transaction } from './transaction.js';

export interface ImportSummary {
  targetCollection: string;
  importDocIds: string[];
  docCreationErrors: any[];
  invalidRows: { rowNum: string | number; rowData: Record<string, any> }[];
  metadata: {
    created: Timestamp;
  };
}

export interface ImportMeta {
  reviewBy?: {
    userId: string | null;
    name: string | null;
  };
  status: 'imported' | 'new' | 'declined';
  eventId?: string;
}

// TODO: fix types

export interface PolicyImportMeta extends ImportMeta {
  targetCollection: 'policies'; // COLLECTIONS.POLICIES;
}

export type StagedPolicyImport = Policy & {
  importMeta: PolicyImportMeta;
  lcnIdMap: Record<string, string>;
};

export interface TransactionsImportMeta extends ImportMeta {
  targetCollection: 'transactions'; // Collection.enum.transaction; // COLLECTIONS.TRANSACTIONS;
}

export type StagedTransactionImport = Transaction & {
  importMeta: TransactionsImportMeta;
};

export interface QuoteImportMeta extends ImportMeta {
  targetCollection: 'quotes'; // COLLECTIONS.QUOTES;
}

export type StagedQuoteImport = Quote & {
  importMeta: QuoteImportMeta;
};

export type StageImportRecord =
  | StagedPolicyImport
  | StagedTransactionImport
  | StagedQuoteImport;
