import { getFirestore } from 'firebase-admin/firestore';
import type { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info } from 'firebase-functions/logger';
import type { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { transactionsCollection } from '../common';
import {
  constructTrxId,
  fetchPolicyData,
  fetchRatingData,
  formatPremiumTrx,
  trxExists,
} from '../modules/transactions';
import { reportErrorSentry } from '../services/sentry';

// using JS Module over classes: https://dev.to/giantmachines/stop-using-javascript-classes-33ij

// Idempotent functions: https://cloud.google.com/blog/products/serverless/cloud-functions-pro-tips-building-idempotent-functions

// Only return error if transient error (can't write to db, etc.)

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
    reportError(`Missing policy ID`, { policyId });
    return;
  }

  const db = getFirestore();
  const trxCol = transactionsCollection(db);

  const policy = await fetchPolicyData(db, policyId);
  if (!policy) {
    reportError(`Policy not found. Returning early.`, { policyId });
    return;
  }

  const locationEntries = policy?.locations && Object.entries(policy.locations);
  if (!locationEntries || !locationEntries.length) {
    reportError('No policy locations found in policy', { policyId });
    return;
  }

  for (let [locationId, location] of locationEntries) {
    try {
      const trxId = constructTrxId(policyId, locationId, eventId);
      const trxRef = trxCol.doc(trxId);

      if (!trxExists(trxRef)) {
        const ratingData = await fetchRatingData(db, location.ratingDocId);

        // TODO: handle validation
        // TODO: handle scenarios where rating doc not available (imported policies)

        const locationTrx = formatPremiumTrx('new', policy, location, ratingData, eventId);

        await trxRef.set({ ...locationTrx });

        info(`New transaction saved for location ${locationId}`, { locationTrx });
      }
    } catch (err: any) {
      reportError(
        `Error creating transaction for location ID ${locationId}`,
        { policyId, locationId },
        err
      );
    }
  }

  return;
};

export function reportError(msg: string, ctx: Record<string, any> = {}, err: any = null) {
  error(msg, { ...ctx, err });
  reportErrorSentry(err || msg, { func: 'policyCreatedListener', msg, ...ctx });
}
