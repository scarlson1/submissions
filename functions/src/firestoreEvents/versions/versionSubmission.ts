import { DocumentSnapshot, FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { merge } from 'lodash-es';

import { Submission, getReportErrorFn, versionsCollection } from '../../common/index.js';
import { getDifference } from '../../modules/utils/index.js';
import { hasOne } from '../../utils/index.js';

const VERSION_SUBMISSION_DIFF_KEYS = [
  'deductible',
  'limits',
  'address',
  'homeState',
  'namedInsured',
  'contact',
  'coordinates',
  'ratingPropertyData',
  'propertyDataDocId',
  'ratingDocId',
  'agent',
  'agency',
  'subproducerCommission',
  'mailingAddress',
  'AALs',
  'annualPremium',
  'subproducerCommission',
];

const reportErr = getReportErrorFn('versionSubmission');

export default async (
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { submissionId: string }>
) => {
  try {
    const { submissionId } = event.params;

    const beforeData = event?.data?.before?.data() as Submission | undefined;
    const afterData = event?.data?.after?.data() as Submission | undefined;

    const currentVersion = afterData?.metadata?.version;

    const diff = getDifference(beforeData || {}, afterData || {});
    const shouldVersion = hasOne(VERSION_SUBMISSION_DIFF_KEYS, Object.keys(diff));
    info('Submission version diff', { diff, shouldVersion });

    const returnEarly = currentVersion && !shouldVersion;
    if (returnEarly || !Boolean(afterData)) {
      info('No changes');
      return;
    }

    info(`Submission change detected (${submissionId})`, {
      submissionId,
      prevData: beforeData || null,
      newData: afterData || 'deleted',
    });

    const db = getFirestore();
    const versionsCol = versionsCollection(db, 'SUBMISSIONS', submissionId);

    const batch = db.batch();

    batch.set(
      event!.data!.after.ref,
      {
        metadata: {
          version: FieldValue.increment(1),
        },
      },
      { merge: true }
    );

    if (shouldVersion && beforeData) {
      const versionDocId = beforeData.metadata?.version || 0;
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
