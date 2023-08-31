import { getFirestore } from 'firebase-admin/firestore';
import type { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info, warn } from 'firebase-functions/logger';
import type { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { getReportErrorFn, transactionsCollection } from '../common';
import {
  constructTrxId,
  docExists,
  fetchPolicyData,
  fetchRatingData,
  formatPremiumTrx,
} from '../modules/transactions';

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

  const policy = await fetchPolicyData(db, policyId);
  if (!policy) {
    reportErr(`Policy not found. Returning early.`, { policyId });
    return;
  }

  const locationEntries = policy?.locations && Object.entries(policy.locations);
  if (!locationEntries || !locationEntries.length) {
    reportErr('No policy locations found in policy', { policyId });
    return;
  }

  for (let [locationId, location] of locationEntries) {
    try {
      const trxId = constructTrxId(policyId, locationId, eventId);
      const trxRef = trxCol.doc(trxId);
      info(`Checking for existing trx (${trxId})`);

      const exists = await docExists(trxRef);
      if (!exists) {
        const ratingData = await fetchRatingData(db, location.ratingDocId);

        // TODO: handle validation
        // TODO: handle scenarios where rating doc not available (imported policies)

        const locationTrx = formatPremiumTrx('new', policy, location, ratingData, eventId);

        info(`saving new policy transaction...`, { transaction: locationTrx });
        await trxRef.set({ ...locationTrx });

        info(`New transaction saved for location ${locationId}`, { locationTrx });
      } else {
        warn(`skipping trx - transaction already exists (${trxId})`);
      }
    } catch (err: any) {
      reportErr(
        `Error creating transaction for location ID ${locationId}`,
        { policyId, locationId },
        err
      );
    }
  }

  return;
};
