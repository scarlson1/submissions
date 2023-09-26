import { DocumentSnapshot, FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { merge } from 'lodash-es';

import { Quote, getReportErrorFn, versionsCollection } from '../../common/index.js';
import { getDifference } from '../../utils/index.js';
import { hasOne } from '../../utils/index.js';

const VERSION_QUOTE_DIFF_KEYS = [
  'deductible',
  'limits',
  'address',
  'homeState',
  'fees',
  'taxes',
  'annualPremium',
  'quoteTotal',
  'namedInsured',
  'agent',
  'agency',
  'mailingAddress',
];

const reportErr = getReportErrorFn('versionPolicy');

export default async (
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { quoteId: string }>
) => {
  try {
    const { quoteId } = event.params;

    // const quoteSnap =
    //   event?.data?.before ?? (event?.data?.after as DocumentSnapshot<Quote> | undefined);
    const beforeData = event?.data?.before?.data() as Quote | undefined;
    const afterData = event?.data?.after?.data() as Quote | undefined;

    const currentVersion = afterData?.metadata?.version;

    const diff = getDifference(beforeData || {}, afterData || {});
    const shouldVersion = hasOne(VERSION_QUOTE_DIFF_KEYS, Object.keys(diff));
    info('Quote version diff', { diff, shouldVersion });

    const returnEarly = currentVersion && !shouldVersion;
    if (returnEarly || !Boolean(afterData)) {
      info('No changes');
      return;
    }

    info(`Quote change detected (${quoteId})`, {
      quoteId,
      prevData: beforeData || null,
      newData: afterData || 'deleted',
    });

    const db = getFirestore();
    const versionsCol = versionsCollection(db, 'QUOTES', quoteId);

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
