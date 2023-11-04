import { Timestamp, getFirestore } from 'firebase-admin/firestore';
// import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { isValid } from 'date-fns';
import {
  OffsetTransaction,
  getReportErrorFn,
  locationsCollection,
  transactionsCollection,
} from '../common/index.js';
import { docExists } from '../modules/db/index.js';
import {
  constructTrxId,
  fetchPolicyData,
  fetchPreviousTrx,
  getReinstatementTrx,
} from '../modules/transactions/index.js';
import { verify } from '../utils/index.js';

// reinstatement trxEffDate = cancellation date (from cancellation trx)
// booking date ??

// TODO: need to handle location reinstatement

const reportErr = getReportErrorFn('reinstatementListener');

// TODO: need to pass reinstatement effective date
export interface ReinstatementPayload {
  policyId: string;
  effDateMS: number;
}

export default async (event: CloudEvent<MessagePublishedData<ReinstatementPayload>>) => {
  info('POLICY REINSTATEMENT EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  const eventId = event.id;
  let policyId = null;
  let effDateMS = null;

  try {
    policyId = event.data?.message?.json?.policyId;
    effDateMS = event.data?.message?.json?.effDateMS;
  } catch (e) {
    error('PubSub message was not JSON', e);
  }

  if (!policyId || typeof policyId !== 'string') {
    reportErr(`Missing policy ID. Returning early.`, { policyId });
    return;
  }

  const db = getFirestore();
  const trxCol = transactionsCollection(db);
  const locationsCol = locationsCollection(db);

  const policy = await fetchPolicyData(db, policyId);
  if (!policy) {
    reportErr(`Policy not found. Returning early.`, { policyId });
    return;
  }

  // const locationEntries = policy?.locations && Object.entries(policy.locations);
  const locationIds = Object.keys(policy?.locations || {});
  if (!locationIds.length) {
    // !locationEntries || !locationEntries.length
    reportErr('No policy locations found in policy', { policyId });
    return;
  }
  // TODO: decide whether to add all transactions to batch ??
  // would need to move try/catch outside for loop
  // for (const [locationId, location] of locationEntries) {
  for (const locationId of locationIds) {
    try {
      const trxId = constructTrxId(policyId, locationId, eventId);
      const trxRef = trxCol.doc(trxId);

      const exists = await docExists(trxRef);
      if (!exists) {
        // Not necessary b/c values stored in prev trx
        // const ratingData = await fetchRatingData(db, location.ratingDocId);

        const locationRequest = locationsCol.doc(locationId).get();
        const prevTrxRequest = fetchPreviousTrx(db, policyId, locationId, [
          'cancellation',
          'flat_cancel',
        ]) as Promise<OffsetTransaction>;

        const [locationSnap, prevTrx] = await Promise.all([locationRequest, prevTrxRequest]);
        const location = locationSnap.exists ? locationSnap.data() : null;
        verify(location, 'location doc not found');

        const trxEffDate =
          effDateMS && isValid(effDateMS) ? Timestamp.fromMillis(effDateMS) : Timestamp.now();

        const trx = getReinstatementTrx(policy, location, prevTrx, trxEffDate, eventId);

        await trxRef.set({ ...trx });

        info(`New transaction saved for location ${locationId}`, { trx });
      }
    } catch (err: any) {
      reportErr(`Error creating reinstatement`, { policyId, locationId }, err);
    }
  }
};
