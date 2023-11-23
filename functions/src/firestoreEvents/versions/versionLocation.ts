import { Collection, ILocation } from '@idemand/common';
import { DocumentSnapshot, FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { merge } from 'lodash-es';
import { getReportErrorFn, policiesCollection, versionsCollection } from '../../common/index.js';
import { getDifference, hasOne } from '../../utils/index.js';

const VERSION_LOCATION_DIFF_KEYS = [
  'parentType',
  'address',
  'coordinates',
  'annualPremium',
  'termPremium',
  'limits',
  'RCVs',
  'ratingData',
  'effectiveDate',
  'expirationDate',
];

const reportErr = getReportErrorFn('versionLocation');

export default async (
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { locationId: string }>
) => {
  try {
    const { locationId } = event.params;

    const beforeData = event?.data?.before?.data() as ILocation | undefined;
    const afterData = event?.data?.after?.data() as ILocation | undefined;

    const currentVersion = afterData?.metadata?.version;

    const diff = getDifference(beforeData || {}, afterData || {});
    const shouldVersion = beforeData && hasOne(VERSION_LOCATION_DIFF_KEYS, Object.keys(diff));
    info('Location version diff', { diff, shouldVersion });

    const returnEarly = currentVersion && !shouldVersion;
    if (returnEarly || !Boolean(afterData)) {
      info('No changes');
      return;
    }

    info(`Location change detected (${locationId})`, {
      locationId,
      prevData: beforeData || null,
      newData: afterData || 'deleted',
    });

    const db = getFirestore();
    const versionsCol = versionsCollection(db, Collection.enum.locations, locationId);
    const policiesCol = policiesCollection(db);

    const batch = db.batch();

    batch.set(
      event.data!.after.ref,
      {
        metadata: {
          version: FieldValue.increment(1),
        },
      },
      { merge: true }
    );

    // TODO: need to use transaction to ensure same version (could have multiple location changes at the same time - batched) ??
    // policy snap race condition ??

    if (afterData?.policyId) {
      // const oldVersion = afterData?.metadata?.version ?? 0;
      let policySnap = await policiesCol.doc(afterData.policyId).get();
      // might not exist if policy import from CSV
      if (policySnap.exists) {
        // don't add to policy locations if it's not already in policy
        let policyLcns = policySnap.data()?.locations;
        let policyLcn = policyLcns ? policyLcns[locationId] : null;
        if (policyLcn) {
          const policyUpdates: Record<string, any> = {};
          policyUpdates[`locations.${locationId}.version`] = FieldValue.increment(1);
          // const policyUpdates = {
          //   [`locations.${locationId}.version`]: oldVersion + 1,
          // };
          batch.update(policySnap.ref, policyUpdates);
        }
      }
    }

    if (shouldVersion) {
      const versionDocId = beforeData?.metadata?.version || 0;
      const versionRef = versionsCol.doc(`${versionDocId}`);

      const versionData = merge(beforeData, {
        metadata: { versionCreated: Timestamp.now() },
      });
      batch.set(versionRef, versionData);
    }

    await batch.commit();
    info(`saved location version - location ID: ${locationId}`, {
      beforeData: beforeData || null,
      afterData: afterData || null,
    });
  } catch (err: any) {
    let errMsg = 'error saving location version';
    if (err?.message) errMsg += ` ${err.message}`;
    reportErr(errMsg, { ...event }, err);
  }
  return;
};
