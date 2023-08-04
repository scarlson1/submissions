import { getFirestore } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { OffsetTransaction, getReportErrorFn, transactionsCollection } from '../common';

import {
  constructTrxId,
  fetchPolicyData,
  fetchPreviousTrx,
  getReinstatementTrx,
  trxExists,
} from '../utils/transactions';

// reinstatement trxEffDate = cancellation date (from cancellation trx)
// booking date ??

// TODO: need to handle location reinstatement

const reportError = getReportErrorFn('reinstatementListener');

export interface ReinstatementPayload {
  policyId: string;
}

export default async (event: CloudEvent<MessagePublishedData<ReinstatementPayload>>) => {
  info('POLICY REINSTATEMENT EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  const eventId = event.id;
  let policyId = null;
  try {
    policyId = event.data?.message?.json?.policyId;
  } catch (e) {
    error('PubSub message was not JSON', e);
  }

  if (!policyId || typeof policyId !== 'string') {
    reportError(`Missing policy ID. Returning early.`, { policyId });
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
  // TODO: decide whether to add all transactions to batch ??
  // would need to move try/catch outside for loop
  for (const [locationId, location] of locationEntries) {
    try {
      const trxId = constructTrxId(policyId, locationId, eventId);
      const trxRef = trxCol.doc(trxId);

      if (!trxExists(trxRef)) {
        // Not neccessary b/c values stored in prev trx
        // const ratingData = await fetchRatingData(db, location.ratingDocId);

        const prevTrx = (await fetchPreviousTrx(db, policyId, locationId, [
          'cancellation',
          'flat_cancel',
        ])) as OffsetTransaction;

        const trx = getReinstatementTrx(policy, location, prevTrx, eventId);

        await trxRef.set({ ...trx });

        info(`New transaction saved for location ${locationId}`, { trx });
      }
    } catch (err: any) {
      reportError(`Error creating reinstatement`, { policyId, locationId }, err);
    }
  }
};
