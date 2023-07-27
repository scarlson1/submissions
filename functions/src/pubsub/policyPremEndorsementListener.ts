import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info, warn } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { Transaction, TransactionType, transactionsCollection } from '../common';
import {
  constructTrxId,
  fetchPolicyData,
  fetchPreviousTrx,
  fetchRatingData,
  formatPremiumTrx,
  getPremEndorsementOffsetTrx,
  trxExists,
} from '../utils/transactions';

// Handles creating tranactions whenever a LOCATION premium change event is published (per location)
//    - trx1: offsets the remaining period for the original trx
//    - trx2: new premium for the term

// TODO: use atomic operation

const premEndorsementPrevTypes: TransactionType[] = [
  'new',
  'renewal',
  'reinstatement',
  'prem_endorsement',
];

interface PolicyPremEndorsementPayload {
  policyId: string;
  locationId: string;
}

export default async (event: CloudEvent<MessagePublishedData<PolicyPremEndorsementPayload>>) => {
  info('PREM ENDORSEMENT EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });
  const eventId = event.id;
  let policyId = null;
  let locationId = null;

  try {
    policyId = event.data?.message?.json?.policyId;
    locationId = event.data?.message?.json?.locationId;
  } catch (e) {
    error('PubSub message was not JSON', e);
  }

  if (!policyId || !locationId || typeof policyId !== 'string' || typeof locationId !== 'string') {
    error(`Missing policy and/or location ID`, { policyId, locationId });
    return; // TODO: report error
  }

  const db = getFirestore();
  const trxCol = transactionsCollection(db);

  const policy = await fetchPolicyData(db, policyId);
  if (!policy) {
    warn(`Policy not found. Returning early.`); // TODO: report error
    return;
  }

  const location = policy.locations[locationId];
  if (!location) {
    error(`location (${locationId}) not found on policy (${policyId})`);
    return;
  }

  let prevTrx: Transaction;
  try {
    prevTrx = await fetchPreviousTrx(db, policyId, locationId, premEndorsementPrevTypes);
  } catch (err: any) {
    error(`No previous transactions found matching query. returning early`, {
      policyId,
      locationId,
      err,
    });
    return;
  }

  try {
    const trxId = constructTrxId(policyId, locationId, eventId);
    const trxRef = trxCol.doc(trxId);

    if (!trxExists(trxRef)) {
      const ratingData = await fetchRatingData(db, location.ratingDocId);

      const batch = db.batch();

      const trxTimestamp = Timestamp.now();

      const offsetTrxRef = trxCol.doc(`${trxId}-offset`);
      const offsetTrx = getPremEndorsementOffsetTrx(prevTrx, trxTimestamp) as Transaction;
      batch.set(offsetTrxRef, { ...offsetTrx });

      const locationTrx = formatPremiumTrx(
        'prem_endorsement',
        policy,
        location,
        ratingData,
        policyId,
        eventId
      );
      batch.set(trxRef, { ...locationTrx });

      await batch.commit();
      // await trxRef.set({ ...locationTrx });
      info(`Prem endorsement transactions saved for location ${locationId}`, {
        offsetTrx,
        locationTrx,
      });
    }
  } catch (err: any) {
    error(`Error saving transaction`, { err });
  }

  return;
};
