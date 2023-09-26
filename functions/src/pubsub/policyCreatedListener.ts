import { getFirestore } from 'firebase-admin/firestore';
import type { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info, warn } from 'firebase-functions/logger';
import type { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import {
  getReportErrorFn,
  locationsCollection,
  splitChunks,
  transactionsCollection,
} from '../common/index.js';
import { getAllById } from '../modules/db/index.js';
import {
  constructTrxId,
  docExists,
  fetchPolicyData,
  fetchRatingData,
  formatPremiumTrx,
} from '../modules/transactions/index.js';
import { verify } from '../utils/index.js';

// using JS Module over classes: https://dev.to/giantmachines/stop-using-javascript-classes-33ij

// Idempotent functions: https://cloud.google.com/blog/products/serverless/cloud-functions-pro-tips-building-idempotent-functions

// Only return error if transient error (can't write to db, etc.)

const reportErr = getReportErrorFn('policyCreatedListener');

// CREATES TRANSACTION FOR EACH LOCATION IN NEW POLICY

export interface PolicyCreatedPayload {
  policyId: string;
}

export default async (event: CloudEvent<MessagePublishedData<PolicyCreatedPayload>>) => {
  info('POLICY CREATED EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  const eventId = event.id;
  let policyId = null;
  try {
    policyId = event.data?.message?.json?.policyId;
  } catch (e) {
    error('PubSub message was not JSON', e);
  }

  if (!policyId || typeof policyId !== 'string') {
    reportErr(`Missing policy ID`, { policyId });
    return;
  }

  const db = getFirestore();
  const trxCol = transactionsCollection(db);
  const locationsCol = locationsCollection(db);
  let policy;
  let locations;

  try {
    policy = await fetchPolicyData(db, policyId);
    verify(policy, `Policy not found. Returning early.`);

    const locationIds = Object.keys(policy.locations || {});
    verify(locationIds.length, 'no locations found on policy');

    const locationSnaps = await getAllById(locationsCol, locationIds);

    locations = locationSnaps.docs
      .filter((snap) => snap.exists)
      .map((snap) => ({ ...snap.data(), id: snap.id }));

    verify(locations && locations.length, 'location docs not found');

    // TODO: need to throw if locations.length !== locationIds.length ??
    if (locations.length !== locationIds.length) {
      reportErr(
        `new policy location docs ${locations.length} do not match locationIds (${locationIds.length}). Continuing to create trx for ${locations.length} locations`,
        { policyId }
      );
    }
  } catch (err: any) {
    const msg = err?.message || 'error getting policy/location data';
    reportErr(msg, { policyId });
    return;
  }

  const chunks = locations.length > 250 ? splitChunks(locations, 250) : [locations];

  for (const chunk of chunks) {
    try {
      let batch = db.batch();

      for (const l of chunk) {
        const { id: locationId, ...location } = l;

        const trxId = constructTrxId(policyId, locationId, eventId);
        const trxRef = trxCol.doc(trxId);
        info(`Checking for existing trx (${trxId})`);

        const exists = await docExists(trxRef);
        if (!exists) {
          const ratingData = await fetchRatingData(db, location.ratingDocId);
          console.log('RATING DATA: ', ratingData);

          // TODO: handle validation

          const locationTrx = formatPremiumTrx(
            'new',
            policy,
            location,
            ratingData,
            location.effectiveDate,
            eventId
          );

          info(`setting batch - new policy transaction...`, { transaction: locationTrx });
          // await trxRef.set({ ...locationTrx });
          batch.set(trxRef, locationTrx);

          info(`New transaction saved for location ${locationId}`, { locationTrx });
        } else {
          warn(`skipping trx - transaction already exists (${trxId})`);
        }
      }

      info(`committing batch of ${chunk.length} new transactions...`, { policyId });
      await batch.commit();
    } catch (err: any) {
      reportErr(`Error creating transaction for policy ID ${policyId}`, { policyId, chunk }, err);
    }
  }

  // for (const l of locations) {
  //   const { id: locationId, ...location } = l;
  //   try {
  //     const trxId = constructTrxId(policyId, locationId, eventId);
  //     const trxRef = trxCol.doc(trxId);
  //     info(`Checking for existing trx (${trxId})`);

  //     const exists = await docExists(trxRef);
  //     if (!exists) {
  //       const ratingData = await fetchRatingData(db, location.ratingDocId);
  //       console.log('RATING DATA: ', ratingData);

  //       const locationTrx = formatPremiumTrx('new', policy, location, ratingData, eventId);

  //       info(`saving new policy transaction...`, { transaction: locationTrx });
  //       await trxRef.set({ ...locationTrx });

  //       info(`New transaction saved for location ${locationId}`, { locationTrx });
  //     } else {
  //       warn(`skipping trx - transaction already exists (${trxId})`);
  //     }
  //   } catch (err: any) {
  //     reportErr(
  //       `Error creating transaction for location ID ${locationId}`,
  //       { policyId, locationId },
  //       err
  //     );
  //   }
  // }

  return;
};
