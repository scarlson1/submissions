import type { User as TUser } from '@idemand/common';
import {
  policiesCollection,
  quotesCollection,
  submissionsCollection,
  User,
} from '@idemand/common';
import {
  DocumentSnapshot,
  getFirestore,
  Timestamp,
} from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { Change, FirestoreEvent } from 'firebase-functions/v2/firestore';
import { isEqual } from 'lodash-es';
import { transactionsCollection } from '../common/dbCollections.js';
import { getReportErrorFn } from '../common/helpers.js';
import { getDifference, hasOne } from '../utils/index.js';

// TODO: only update policies if user's email is verified ??
// TODO: add mailing Address ?? should policy mailing address be updated based on change in user ??

type UserKey = keyof TUser;
const USER_DIFF_KEYS: UserKey[] = [
  'displayName',
  'firstName',
  'lastName',
  'email',
  'phone',
  'orgId',
  'photoURL',
  // 'address'
];

const reportErr = getReportErrorFn('updateDocsOnUserChange');

export default async (
  event: FirestoreEvent<
    Change<DocumentSnapshot> | undefined,
    {
      userId: string;
    }
  >,
) => {
  const { userId } = event.params;
  const beforeData = event?.data?.after.data() as User | undefined;
  const afterData = event?.data?.before.data() as User | undefined;

  const diff = getDifference(beforeData || {}, afterData || {});
  const diffKeys = Object.keys(diff);
  const shouldUpdate = beforeData && hasOne(USER_DIFF_KEYS, diffKeys);
  info('User version diff', { diff, shouldUpdate });

  if (!shouldUpdate || !afterData) return;

  const db = getFirestore();
  const policiesCol = policiesCollection(db);
  const quotesCol = quotesCollection(db);
  const submissionsCol = submissionsCollection(db);
  const transactionsCol = transactionsCollection(db);

  // need to get user from auth to determine whether to search for insured or agent ??
  // or should search both anyway ??

  const user = afterData;

  // *** NAMED INSURED UPDATES ***
  // TODO: only update policies if user's email is verified ??
  try {
    info(`Fetching policies to update with user change ${userId}...`);
    // need an or query ?? namedInsured.userId or userId ??
    const policySnaps = await policiesCol
      .where('namedInsured.userId', '==', userId)
      .get();
    info(
      `Updating policies with user change ${userId} [COUNT: ${policySnaps.docs.length}]...`,
    );

    const promises = policySnaps.docs.map(async (snap) => {
      const prevNamedInsured = snap.data()?.namedInsured;
      // const prevMailingAddress = snap.data()?.mailingAddress

      // don't overwrite entity display names with contact name
      const { displayName, firstName, lastName } = prevNamedInsured || {};
      const displayNameIsName = isEqual(
        displayName,
        `${firstName} ${lastName}`,
      );
      const newDisplayName = displayNameIsName
        ? user.displayName
        : prevNamedInsured.displayName;

      return snap.ref.update({
        'namedInsured.displayName':
          newDisplayName || prevNamedInsured.displayName,
        'namedInsured.firstName': user.firstName || prevNamedInsured.firstName,
        'namedInsured.lastName': user.lastName || prevNamedInsured.lastName,
        'namedInsured.email': user.email || prevNamedInsured.email,
        'namedInsured.phone': user.phone || prevNamedInsured.phone, // @ts-ignore
        'namedInsured.photoURL': user.photoURL || null,
        'metadata.updated': Timestamp.now(),
      }); // TODO: move .catch to here ?? log/handle error for each update ??
    });

    await Promise.all(promises);
    info('Successfully updated policies with user changes');
  } catch (err: any) {
    let msg = 'Error updating policy with user change';
    if (err.message) msg += ` ${err.message}`;
    reportErr(msg, { userId, diff }, err);
  }

  try {
    info(`Fetching quotes to update with user change ${userId}...`);
    const quoteSnaps = await quotesCol
      .where('namedInsured.userId', '==', userId)
      .get();
    info(
      `Updating quotes with user change ${userId} [COUNT: ${quoteSnaps.docs.length}]...`,
    );

    const promises = quoteSnaps.docs.map(async (snap) => {
      const prevNI = snap.data()?.namedInsured;
      // const prevName = snap.data()?.agency?.name;
      // const prevAddress = snap.data()?.agency?.address;

      return snap.ref.update({
        'namedInsured.firstName': user.firstName || prevNI.firstName,
        'namedInsured.lastName': user.lastName || prevNI.lastName,
        'namedInsured.email': user.email || prevNI.email,
        'namedInsured.phone': user.phone || prevNI.phone, // @ts-ignore
        'namedInsured.photoURL': user.photoURL || null,
        'metadata.updated': Timestamp.now(),
      });
    });

    await Promise.all(promises);
    info('Successfully updated quotes with user changes');
  } catch (err: any) {
    let msg = 'Error updating quote with user change';
    if (err.message) msg += ` ${err.message}`;
    reportErr(msg, { userId, diff }, err);
  }

  // *** AGENT UPDATES ***

  try {
    info(`Fetching policies to update with agent change ${userId}...`);
    // need an or query ?? namedInsured.userId or userId ??
    const policySnaps = await policiesCol
      .where('agent.userId', '==', userId)
      .get();
    info(
      `Updating policies with agent change ${userId} [COUNT: ${policySnaps.docs.length}]...`,
    );

    const promises = policySnaps.docs.map(async (snap) => {
      const prevAgent = snap.data()?.agent;

      return snap.ref.update({
        'agent.name': user.displayName || prevAgent.name,
        'agent.email': user.email || prevAgent.email,
        'agent.phone': user.phone || prevAgent.phone,
        'agent.photoURL': user.photoURL || null,
        'metadata.updated': Timestamp.now(),
      });
    });

    await Promise.all(promises);
    info('Successfully updated policies with agent changes');
  } catch (err: any) {
    let msg = 'Error updating policy with agent change';
    if (err.message) msg += ` ${err.message}`;
    reportErr(msg, { userId, diff }, err);
  }

  try {
    info(`Fetching quotes to update with agent change ${userId}...`);
    const quoteSnaps = await quotesCol
      .where('namedInsured.userId', '==', userId)
      .get();
    info(
      `Updating quotes with user change ${userId} [COUNT: ${quoteSnaps.docs.length}]...`,
    );

    const promises = quoteSnaps.docs.map(async (snap) => {
      const prevAgent = snap.data()?.agent;

      return snap.ref.update({
        'agent.name': user.displayName || prevAgent.name,
        'agent.email': user.email || prevAgent.email,
        'agent.phone': user.phone || prevAgent.phone,
        'agent.photoURL': user.photoURL || null,
        'metadata.updated': Timestamp.now(),
      });
    });

    await Promise.all(promises);
    info('Successfully updated quotes with agent changes');
  } catch (err: any) {
    let msg = 'Error updating quote with agent change';
    if (err.message) msg += ` ${err.message}`;
    reportErr(msg, { userId, diff }, err);
  }

  try {
    info(`Fetching submissions to update with agent change ${userId}...`);
    const submissionSnaps = await submissionsCol
      .where('agent.userId', '==', userId)
      .get();
    info(
      `Updating submissions with agent change ${userId} [COUNT: ${submissionSnaps.docs.length}]...`,
    );

    const promises = submissionSnaps.docs.map(async (snap) => {
      const prevAgent = snap.data()?.agent;

      return snap.ref.update({
        'agent.name': user.displayName || prevAgent?.name || null,
        'agent.email': user.email || prevAgent?.email || null,
        'agent.phone': user.phone || prevAgent?.phone || null,
        'agent.photoURL': user.photoURL || null,
        'metadata.updated': Timestamp.now(),
      });
    });

    await Promise.all(promises);
    info('Successfully updated submissions with agent changes');
  } catch (err: any) {
    let msg = 'Error updating submissions with agent change';
    if (err.message) msg += ` ${err.message}`;
    reportErr(msg, { userId, diff }, err);
  }

  try {
    info(`Fetching transactions to update with user change ${userId}...`);
    const trxSnaps = await transactionsCol
      .where('agent.userId', '==', userId)
      .get();
    info(
      `Updating transactions with user change ${userId} [COUNT: ${trxSnaps.docs.length}]...`,
    );

    const promises = trxSnaps.docs.map(async (snap) => {
      const prevAgent = snap.data()?.agent;

      return snap.ref.update({
        'agent.name': user.displayName || prevAgent?.name || '',
        'agent.email': user.email || prevAgent?.email || '',
        'agent.phone': user.phone || prevAgent?.phone || null,
        'agent.photoURL': user.photoURL || null,
        'metadata.updated': Timestamp.now(),
      });
    });

    await Promise.all(promises);
    info('Successfully updated transactions with user changes');
  } catch (err: any) {
    let msg = 'Error updating transaction with user change';
    if (err.message) msg += ` ${err.message}`;
    reportErr(msg, { userId, diff }, err);
  }

  return;
};
