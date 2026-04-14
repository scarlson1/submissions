import type { TaxTransaction } from '@idemand/common';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import type { Change } from 'firebase-functions/core';
import type { FirestoreEvent } from 'firebase-functions/firestore';
import { getTable } from '../services/bigquery/ensureTables.js';
import { taxTransactionToRow } from '../services/bigquery/rowTransforms/taxTransaction.js';
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
    | TaxTransaction
    | undefined;
  if (!data) return;

  const trxRow = taxTransactionToRow(trxId, data, isDelete);

  const taxTrxTable = await getTable(
    bigqueryDataset.value(),
    'tax_transactions',
  );

  await streamRows(taxTrxTable, [trxRow], (r) => `${r._id}_${r._doc_version}`);
};
