import { Collection } from '@idemand/common';
import { onDocumentWritten } from 'firebase-functions/firestore';

export const syncpolicytobq = onDocumentWritten(
  { document: `${Collection.Enum.policies}/{policyId}` },
  async (event) => {
    await (await import('./syncPolicyToBQ.js')).default(event);
  },
);

export const syncquotetobq = onDocumentWritten(
  { document: `${Collection.Enum.quotes}/{quoteId}` },
  async (event) => {
    await (await import('./syncQuoteToBQ.js')).default(event);
  },
);

export const synctransactiontobq = onDocumentWritten(
  { document: `${Collection.Enum.transactions}/{trxId}` },
  async (event) => {
    await (await import('./syncTransactionToBQ.js')).default(event);
  },
);

export const synctaxtransactiontobq = onDocumentWritten(
  { document: `${Collection.Enum.taxTransactions}/{trxId}` },
  async (event) => {
    await (await import('./syncTaxTransactionToBQ.js')).default(event);
  },
);

export const synctaxcalctobq = onDocumentWritten(
  { document: `${Collection.Enum.taxCalculations}/{docId}` },
  async (event) => {
    await (await import('./syncTaxCalcToBQ.js')).default(event);
  },
);
