import {
  Organization,
  policiesCollection,
  quotesCollection,
  submissionsCollection,
} from '@idemand/common';
import { getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, DocumentSnapshot, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getReportErrorFn } from '../common/index.js';
import { getDifference } from '../utils/getDifference.js';
import { hasOne } from '../utils/index.js';

const reportErr = getReportErrorFn('updateDocsOnOrgChange');

// TODO: any other collections aside from transactions ?? (user permissions, etc.)
// licenses ??

// const X = getZodObjPaths(Organization)
// const OrgPaths = zodEnumFromObjKeys(Organization)
// const ORG_DIFF_KEYS: z.infer<typeof OrgPaths>[] = ['orgName', 'address']
const ORG_DIFF_KEYS = ['orgName', 'address', 'photoURL'];

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      orgId: string;
    }
  >
) => {
  const { orgId } = event.params;
  const beforeData = event?.data?.after.data() as Organization | undefined;
  const afterData = event?.data?.before.data() as Organization | undefined;

  const diff = getDifference(beforeData || {}, afterData || {});
  const diffKeys = Object.keys(diff);
  const shouldUpdate = beforeData && hasOne(ORG_DIFF_KEYS, diffKeys);
  info('Org version diff', { diff, shouldUpdate });

  if (!shouldUpdate || !afterData) return;

  const db = getFirestore();
  const policiesCol = policiesCollection(db);
  const quotesCol = quotesCollection(db);
  const submissionsCol = submissionsCollection(db);
  // const transactionsCol = transactionsCollection(db);

  // use bulk writer ??
  // const writer= db.bulkWriter();

  const orgName = afterData?.orgName;
  const orgAddress = afterData?.address;
  // @ts-ignore (need to publish common module)
  const photoURL = afterData?.photoURL;

  try {
    info(`Fetching policies to update with org change ${orgId}...`);
    const policySnaps = await policiesCol.where('agency.orgId', '==', orgId).get();
    info(`Updating policies with org change ${orgId} [COUNT: ${policySnaps.docs.length}]...`);

    const promises = policySnaps.docs.map(async (snap) => {
      const prevName = snap.data()?.agency?.name || '';
      const prevAddress = snap.data()?.agency?.address;

      return snap.ref.update({
        'agency.name': orgName || prevName,
        'agency.address': {
          ...(prevAddress || {}),
          ...(orgAddress || {}),
        },
        'agency.photoURL': photoURL || null,
      });
    });

    await Promise.all(promises);
    info(`Successfully updated policies with org changes`);
  } catch (err: any) {
    let msg = `Error updating policy with org change`;
    if (err.message) msg += ` ${err.message}`;
    reportErr(msg, { orgId, diff }, err);
  }

  try {
    info(`Fetching quotes to update with org change ${orgId}...`);
    const quoteSnaps = await quotesCol.where('agency.orgId', '==', orgId).get();
    info(`Updating quotes with org change ${orgId} [COUNT: ${quoteSnaps.docs.length}]...`);

    const promises = quoteSnaps.docs.map(async (snap) => {
      const prevName = snap.data()?.agency?.name;
      const prevAddress = snap.data()?.agency?.address;

      return snap.ref.update({
        'agency.name': orgName || prevName,
        'agency.address': {
          ...(prevAddress || {}),
          ...(orgAddress || {}),
        },
        'agency.photoURL': photoURL || null,
      });
    });

    await Promise.all(promises);
    info(`Successfully updated quotes with org changes`);
  } catch (err: any) {
    let msg = `Error updating quote with org change`;
    if (err.message) msg += ` ${err.message}`;
    reportErr(msg, { orgId, diff }, err);
  }

  try {
    info(`Fetching submissions to update with org change ${orgId}...`);
    const submissionSnaps = await submissionsCol.where('agency.orgId', '==', orgId).get();
    info(
      `Updating submissions with org change ${orgId} [COUNT: ${submissionSnaps.docs.length}]...`
    );

    const promises = submissionSnaps.docs.map(async (snap) => {
      const prevName = snap.data()?.agency?.name;
      const prevAddress = snap.data()?.agency?.address;

      return snap.ref.update({
        'agency.name': orgName || prevName,
        'agency.address': {
          ...(prevAddress || {}),
          ...(orgAddress || {}),
        },
        'agency.photoURL': photoURL || null,
      });
    });

    await Promise.all(promises);
    info(`Successfully updated submissions with org changes`);
  } catch (err: any) {
    let msg = `Error updating submission with org change`;
    if (err.message) msg += ` ${err.message}`;
    reportErr(msg, { orgId, diff }, err);
  }

  // try {
  //   info(`Fetching transactions to update with org change ${orgId}...`);
  //   const trxSnaps = await transactionsCol.where('agency.orgId', '==', orgId).get();
  //   info(
  //     `Updating transactions with org change ${orgId} [COUNT: ${trxSnaps.docs.length}]...`
  //   );

  //   const promises = trxSnaps.docs.map(async (snap) => {
  //     const prevName = snap.data()?.agency?.name;
  //     const prevAddress = snap.data()?.agency?.address;

  //     return snap.ref.update({
  //       'agency.name': orgName || prevName,
  //       'agency.address': {
  //         ...(prevAddress || {}),
  //         ...(orgAddress || {}),
  //       },
  //     });
  //   });

  //   await Promise.all(promises);
  //   info(`Successfully updated transactions with org changes`);
  // } catch (err: any) {
  //   let msg = `Error updating transaction with org change`;
  //   if (err.message) msg += ` ${err.message}`;
  //   reportErr(msg, { orgId, diff }, err);
  // }

  return;
};
