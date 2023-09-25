import { DocumentSnapshot, FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { merge } from 'lodash-es';

import {
  DeepPartial,
  PolicyNew,
  getReportErrorFn,
  versionsCollection,
} from '../../common/index.js';
import { getDifference } from '../../modules/utils/index.js';
import { flattenObj, hasOne } from '../../utils/index.js';

const VERSION_POLICY_DIFF_KEYS = [
  'locations',
  'effectiveDate',
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

const LCN_VERSION_PATTERN = /locations\.[\w*-]+\.version/g;

const reportErr = getReportErrorFn('versionPolicy');

export default async (
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { policyId: string }>
) => {
  try {
    const { policyId } = event.params;

    const beforeData = event?.data?.before?.data() as PolicyNew | undefined;
    const afterData = event?.data?.after?.data() as PolicyNew | undefined;

    const currentVersion = afterData?.metadata?.version;

    const diff = getDifference(beforeData || {}, afterData || {}) as DeepPartial<PolicyNew>;
    const diffKeys = Object.keys(diff);
    let shouldVersion = diffKeys.length ? hasOne(VERSION_POLICY_DIFF_KEYS, diffKeys) : false;

    // if only change to location['locationId'].version
    // then change was triggered by location version update,
    // should not create new policy version (policy version incremented in location versioning function)
    if (shouldVersion && diffKeys.every((k) => k === 'locations')) {
      const flattenedDiff = flattenObj(diff);

      const onlyLcnVersionChange = Object.keys(flattenedDiff).every((key) =>
        LCN_VERSION_PATTERN.test(key)
      );

      info(`Location version change only: ${onlyLcnVersionChange}`, {
        flattenedDiff,
      });
      if (onlyLcnVersionChange) return;
    }

    info('Policy version diff', { diff, shouldVersion });

    const returnEarly = currentVersion && !shouldVersion;
    if (returnEarly || !Boolean(afterData)) {
      info('No changes');
      return;
    }

    info(`Policy change detected (${policyId})`, {
      policyId,
      prevData: beforeData || null,
      newData: afterData || 'deleted',
    });

    const db = getFirestore();
    const versionsCol = versionsCollection(db, 'POLICIES', policyId);

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
