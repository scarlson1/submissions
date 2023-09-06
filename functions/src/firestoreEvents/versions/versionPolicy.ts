import { DocumentSnapshot, FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { info } from 'firebase-functions/logger';
import { merge } from 'lodash';

import { PolicyNew, getReportErrorFn, verify, versionsCollection } from '../../common';
import { getDifference } from '../../modules/utils';

// TODO: add firestore rule not allowing _lastCommitted to change

const VERSION_POLICY_DIFF_KEYS = [
  'locations',
  'effectiveData',
  'expirationDate',
  'termPremium',
  'namedInsured',
  'mailingAddress',
  'term',
  'homeState',
  'fees',
  'taxes',
  'price',
  'agent',
  'agency',
  'surplusLinesProducerOfRecord',
  'issuingCarrier',
];

function hasOne(arr1: string[], arr2: string[]) {
  return arr1.some((r) => arr2.indexOf(r) >= 0);
}

const reportErr = getReportErrorFn('versionPolicy');

export default async (
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { policyId: string }>
) => {
  try {
    const { policyId } = event.params;

    const policySnap =
      event?.data?.before ?? (event?.data?.after as DocumentSnapshot<PolicyNew> | undefined);
    const beforeData = event?.data?.before?.data() as PolicyNew | undefined;
    const afterData = event?.data?.after?.data() as PolicyNew | undefined;

    // Skip if _lastCommitted has changed (already completed update)
    // const skipUpdate =
    //   beforeData?._lastCommitted &&
    //   afterData?._lastCommitted &&
    //   !beforeData?._lastCommitted.isEqual(afterData?._lastCommitted);

    // const isFirstVersion = !beforeData?._lastCommitted && afterData?._lastCommitted;
    const currentVersion = afterData?.metadata?.version;

    // TODO: get change diff and only increment if certain values change (locations, termDays, etc.)
    // could replace _lastCommitted check ??
    // currently causes infinite loop
    const diff = getDifference(beforeData || {}, afterData || {});
    console.log('DIFF: ', diff);
    const shouldVersion = hasOne(VERSION_POLICY_DIFF_KEYS, Object.keys(diff));
    console.log('SHOULD VERSION: ', shouldVersion);

    const returnEarly = currentVersion && !shouldVersion; // isFirstVersion &&
    if (returnEarly) {
      info('No changes');
      return;
    }

    if (afterData?.metadata?.version && afterData?.metadata?.version > 3) return;

    // if (skipUpdate || isFirstVersion) {
    //   info('No changes');
    //   return;
    // }

    info(`Policy change detected (${policyId})`, {
      policyId,
      prevData: beforeData || null,
      newData: afterData || 'deleted',
    });

    verify(policySnap, 'policy ref undefined');

    const db = getFirestore();
    const versionsCol = versionsCollection(db, 'POLICIES', policyId);

    const batch = db.batch();

    batch.set(
      policySnap.ref,
      {
        metadata: {
          version: FieldValue.increment(1),
        },
        // _lastCommitted: Timestamp.now(),
      },
      { merge: true }
    );

    if (shouldVersion) {
      // beforeData && beforeData?._lastCommitted
      const versionDocId = beforeData?.metadata?.version || 0;
      const versionRef = versionsCol.doc(`${versionDocId}`);

      const versionData = merge(beforeData, {
        metadata: { versionCreated: Timestamp.now() },
      });
      batch.set(versionRef, versionData);
    }
    await batch.commit();
  } catch (err: any) {
    let errMsg = 'error saving policy version';
    if (err?.message) errMsg += ` ${err.message}`;
    reportErr(errMsg, { ...event }, err);
  }
  return;
};
