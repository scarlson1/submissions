import {
  locationsCollection,
  type ILocationPolicy,
  type Policy,
} from '@idemand/common';
import { getFirestore, type DocumentSnapshot } from 'firebase-admin/firestore';
import type { Change } from 'firebase-functions/core';
import type { FirestoreEvent } from 'firebase-functions/firestore';
import { getTable } from '../services/bigquery/ensureTables.js';
import {
  policyLocationToRow,
  policyToRow,
} from '../services/bigquery/rowTransforms/policy.js';
import { streamRows } from '../services/bigquery/streamRows.js';
import { bigqueryDataset } from '../utils/environmentVars.js';

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    { policyId: string }
  >,
) => {
  const { policyId } = event.params;
  const isDelete = !event.data?.after?.exists;
  const data = (isDelete ? event.data?.before : event.data?.after)?.data() as
    | Policy
    | undefined;
  if (!data) return;

  const policyRow = policyToRow(policyId, data, isDelete);
  const locationIds = Object.keys(data.locations);
  const db = getFirestore();

  const lcnRefs = locationIds.map((lcnId) =>
    locationsCollection(db).doc(lcnId),
  );
  const lcnSnaps = await db.getAll(...lcnRefs);

  const locationRows = lcnSnaps
    .filter((snap) => snap.exists)
    .map((snap) =>
      policyLocationToRow(
        policyId,
        snap.id,
        snap.data() as ILocationPolicy,
        isDelete,
      ),
    );

  const [policyTable, locationTable] = await Promise.all([
    getTable(bigqueryDataset.value(), 'policies'),
    getTable(bigqueryDataset.value(), 'policy_locations'),
  ]);

  await Promise.all([
    streamRows(policyTable, [policyRow], (r) => `${r._id}_${r._doc_version}`),
    locationRows.length
      ? streamRows(
          locationTable,
          locationRows,
          (r) => `${r.policy_id}_${r.location_id}_${r._doc_version}`,
        )
      : Promise.resolve(),
  ]);
};
