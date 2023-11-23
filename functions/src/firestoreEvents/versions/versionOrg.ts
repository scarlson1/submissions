import type { Organization as TOrg } from '@idemand/common';
import { Organization, versionsCollection } from '@idemand/common';
import { DocumentSnapshot, FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { merge } from 'lodash-es';
import { getReportErrorFn } from '../../common';
import { getDifference, hasOne } from '../../utils';

type OrgKeys = keyof TOrg;
const VERSION_ORG_DIFF_KEYS: OrgKeys[] = [
  'orgName',
  'address',
  'coordinates',
  'defaultCommission',
  'emailDomains',
  'authProviders',
  'FEIN',
  'EandOURL',
  'primaryContact',
  'principalProducer',
  'tenantId',
];

const reportErr = getReportErrorFn('versionOrg');

export default async (
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { orgId: string }>
) => {
  try {
    const { orgId } = event.params;

    const beforeData = event?.data?.before?.data() as Organization | undefined;
    const afterData = event?.data?.after?.data() as Organization | undefined;

    const diff = getDifference(beforeData || {}, afterData || {});
    const shouldVersion = Boolean(beforeData) && hasOne(VERSION_ORG_DIFF_KEYS, Object.keys(diff));

    info('Location version diff', { diff, shouldVersion });

    const currentVersion = afterData?.metadata?.version;
    const returnEarly = currentVersion && !shouldVersion;
    if (returnEarly || !Boolean(afterData)) {
      info('No changes');
      return;
    }

    info(`Org change detected (ID: ${orgId})`, {
      orgId,
      prevData: beforeData || null,
      newData: afterData || 'deleted',
    });

    const db = getFirestore();
    const versionsCol = versionsCollection<Organization>(db, 'organizations', orgId);

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
      info(`creating new version for org ${orgId}...`);
      const versionDocId = beforeData.metadata?.version || 0;
      const versionRef = versionsCol.doc(`${versionDocId}`);

      const versionData = merge(beforeData, {
        metadata: { versionCreated: Timestamp.now() },
      });
      batch.set(versionRef, versionData);
    }

    await batch.commit();
  } catch (err: any) {
    let msg = 'error versioning org';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
  }

  return;
};
