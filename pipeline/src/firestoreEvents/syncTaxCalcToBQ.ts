import type { TaxCalc } from '@idemand/common';
import type { DocumentSnapshot } from 'firebase-admin/firestore';
import type { Change } from 'firebase-functions/core';
import type { FirestoreEvent } from 'firebase-functions/firestore';
import { getTable } from '../services/bigquery/ensureTables.js';
import { taxCalcToRow } from '../services/bigquery/rowTransforms/taxCalculation.js';
import { streamRows } from '../services/bigquery/streamRows.js';
import { bigqueryDataset } from '../utils/environmentVars.js';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    { docId: string }
  >,
) => {
  const { docId } = event.params;
  const isDelete = !event.data?.after?.exists;
  const data = (isDelete ? event.data?.before : event.data?.after)?.data() as
    | TaxCalc
    | undefined;
  if (!data) return;

  const taxCalcRow = taxCalcToRow(docId, data, isDelete);

  const taxCalcTable = await getTable(
    bigqueryDataset.value(),
    'tax_calculations',
  );

  await streamRows(
    taxCalcTable,
    [taxCalcRow],
    (r) => `${r._id}_${r._doc_version}`,
  );
};
