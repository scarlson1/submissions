import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info, warn } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { transactionsCollection } from '../common';
import {
  constructTrxId,
  fetchPolicyData,
  fetchRatingData,
  formatPremiumTrx,
  trxExists,
} from '../utils/transactions';

// TODO: shared logic with new policy event (abstract into module)

interface PolicyRenewalPayload {
  policyId: string;
}

export default async (event: CloudEvent<MessagePublishedData<PolicyRenewalPayload>>) => {
  info('POLICY RENEWAL EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  const eventId = event.id;
  let policyId = null;
  try {
    // TODO: is try/catch necessary ??
    policyId = event.data?.message?.json?.policyId;
  } catch (e) {
    error('PubSub message was not JSON', e);
  }

  if (!policyId || typeof policyId !== 'string') {
    error(`Missing policy ID`, { policyId });
    return; // TODO: report error
  }

  const db = getFirestore();
  // const policyCol = policiesCollection(db); // .withConverter(policyConverter)
  const trxCol = transactionsCollection(db);

  const policy = await fetchPolicyData(db, policyId);
  if (!policy) {
    warn(`Policy not found. Returning early.`); // TODO: report error
    return;
  }

  const locationEntries = policy?.locations && Object.entries(policy.locations);
  if (!locationEntries || !locationEntries.length) {
    error('No policy locations found in policy', {
      policyId,
      eventId,
    });
    return; // TODO: report error
  }

  const trxTimestamp = Timestamp.now();

  for (let [locationId, location] of locationEntries) {
    try {
      const trxId = constructTrxId(policyId, locationId, eventId);
      const trxRef = trxCol.doc(trxId);

      if (!trxExists(trxRef)) {
        const ratingData = await fetchRatingData(db, location.ratingDocId);

        const locationTrx = formatPremiumTrx(
          'renewal',
          policy,
          location,
          ratingData,
          policyId,
          eventId,
          trxTimestamp
        );

        await trxRef.set({ ...locationTrx });
        info(`New transaction saved for location ${locationId}`, { locationTrx });
      }
    } catch (err: any) {
      error(`Error creating transaction for location ${locationId} (Policy ID: ${policyId})`, {
        ...location,
      });
    }
  }

  return;
};
