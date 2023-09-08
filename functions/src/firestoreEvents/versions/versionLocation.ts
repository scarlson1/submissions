import { DocumentSnapshot, FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { merge } from 'lodash';

import { ILocation, getReportErrorFn, versionsCollection } from '../../common';
import { getDifference } from '../../modules/utils';
import { hasOne } from '../../utils';

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
    const versionsCol = versionsCollection(db, 'LOCATIONS', locationId);

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

    if (shouldVersion) {
      const versionDocId = beforeData?.metadata?.version || 0;
      const versionRef = versionsCol.doc(`${versionDocId}`);

      const versionData = merge(beforeData, {
        metadata: { versionCreated: Timestamp.now() },
      });
      batch.set(versionRef, versionData);
    }
    await batch.commit();
  } catch (err: any) {
    let errMsg = 'error saving location version';
    if (err?.message) errMsg += ` ${err.message}`;
    reportErr(errMsg, { ...event }, err);
  }
  return;
};
