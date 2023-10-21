import { getFirestore } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import {
  ILocation,
  Policy,
  WithId,
  getReportErrorFn,
  locationsCollection,
  transactionsCollection,
} from '../common/index.js';
import { docExists, getAllById } from '../modules/db/index.js';
import {
  constructTrxId,
  fetchPolicyData,
  fetchRatingData,
  formatPremiumTrx,
} from '../modules/transactions/index.js';
import { verify } from '../utils/index.js';

// TODO: shared logic with new policy event (abstract into module)

const reportErr = getReportErrorFn('policyRenewalListener');

export interface PolicyRenewalPayload {
  policyId: string;
}

export default async (event: CloudEvent<MessagePublishedData<PolicyRenewalPayload>>) => {
  info('POLICY RENEWAL EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  const eventId = event.id;
  let policyId = null;
  try {
    policyId = event.data?.message?.json?.policyId;
  } catch (e) {
    error('PubSub message was not JSON', e);
  }

  const db = getFirestore();
  // const policyCol = policiesCollection(db); // .withConverter(policyConverter)
  const locationsCol = locationsCollection(db);
  const trxCol = transactionsCollection(db);
  let policy: WithId<Policy> | null;
  let locationEntries;

  try {
    verify(policyId && typeof policyId === 'string', 'invalid/missing policyId');

    const policyRes = await fetchPolicyData(db, policyId);
    verify(policyRes, `Policy not found. Returning early.`);
    policy = { ...policyRes, id: policyId };

    locationEntries = Object.entries(policy?.locations || {});
    verify(locationEntries.length, 'missing locations IDs');
  } catch (err: any) {
    let errMsg = 'error with params or getting docs';
    if (err?.message) errMsg = err.message;
    reportErr(errMsg, { policyId }, err);
    return;
  }

  let locations: WithId<ILocation>[] = [];

  try {
    // filter out cancelled locations
    const filteredIds = locationEntries
      .filter(([id, lcn]) => !lcn.cancelEffDate)
      .map(([id, lcn]) => id);
    const locationSnaps = await getAllById(locationsCol, filteredIds);

    locationSnaps.forEach((snap) => {
      if (snap.exists) locations.push({ ...snap.data(), id: snap.id });
    });
  } catch (err: any) {
    reportErr(`Error fetching location docs`, { policyId }, err);
  }

  // if (!policyId || typeof policyId !== 'string') {
  //   reportErr(`Missing policy ID. Returning early.`, { policyId });
  //   return;
  // }

  // const db = getFirestore();
  // // const policyCol = policiesCollection(db); // .withConverter(policyConverter)
  // const trxCol = transactionsCollection(db);

  // const policy = await fetchPolicyData(db, policyId);
  // if (!policy) {
  //   reportErr(`Policy not found. Returning early.`, { policyId });
  //   return;
  // }

  // const locationEntries = policy?.locations && Object.entries(policy.locations);
  // if (!locationEntries || !locationEntries.length) {
  //   reportErr('No policy locations found in policy', { policyId });
  //   return;
  // }

  // for (let [locationId, location] of locationEntries) {
  // TODO: batch
  for (let location of locations) {
    try {
      const trxId = constructTrxId(policyId, location.id, eventId);
      const trxRef = trxCol.doc(trxId);

      const exists = await docExists(trxRef);
      if (!exists) {
        const ratingData = await fetchRatingData(db, location.ratingDocId);

        const locationTrx = formatPremiumTrx(
          'renewal',
          policy,
          location,
          ratingData,
          location.effectiveDate,
          eventId
        );

        await trxRef.set({ ...locationTrx });
        info(`New transaction saved for location ${location.id}`, { locationTrx });
      }
    } catch (err: any) {
      reportErr(
        `Error creating transaction for location ${location.id} (Policy ID: ${policyId})`,
        { ...location, policyId },
        err
      );
    }
  }

  return;
};

// export function reportErr(msg: string, ctx: Record<string, any> = {}, err: any = null) {
//   error(msg, { ...ctx, err });
//   reportErrSentry(err || msg, { func: 'policyRenewalListener', msg, ...ctx });
// }
