import type { Transaction } from '@idemand/common';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import type { Change } from 'firebase-functions/core';
import type { FirestoreEvent } from 'firebase-functions/firestore';
import { getTable } from '../services/bigquery/ensureTables.js';
import { transactionToRow } from '../services/bigquery/rowTransforms/transaction.js';
import { streamRows } from '../services/bigquery/streamRows.js';
import { bigqueryDataset } from '../utils/environmentVars.js';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    { trxId: string }
  >,
) => {
  const { trxId } = event.params;
  const isDelete = !event.data?.after?.exists;
  const data = (isDelete ? event.data?.before : event.data?.after)?.data() as
    | Transaction
    | undefined;
  if (!data) return;

  const transactionRow = transactionToRow(trxId, data, isDelete);

  const transactionsTable = await getTable(
    bigqueryDataset.value(),
    'transactions',
  );

  await streamRows(
    transactionsTable,
    [transactionRow],
    (r) => `${r._id}_${r._doc_version}`,
  );
};
