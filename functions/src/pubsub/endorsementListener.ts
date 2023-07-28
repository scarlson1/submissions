import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info, warn } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { PremiumTransaction, Transaction, transactionsCollection } from '../common';
import {
  constructTrxId,
  fetchPolicyData,
  fetchPreviousTrx,
  fetchRatingData,
  formatPremiumTrx,
  getOffsetTrx,
  trxExists,
} from '../utils/transactions';
import { reportErrorSentry } from '../services/sentry';

// How is removed location handled ??
// assume deleted if location not found in policy ??
// pass sub type in json (remove_location, add_location, edit_location, etc.) ??

// TODO: How is policy level endorsement handled ?? change in mailing address, etc.

// Handles creating tranactions whenever a LOCATION premium change event is published (per location)
//    - trx1: offsets the remaining period for the original trx
//    - trx2: new premium for the term

export const premEndorsementPrevTypes: PremiumTransaction['trxType'][] = [
  'new',
  'renewal',
  'reinstatement',
  'endorsement',
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
    reportEndorsementError(
      'PubSub message was not JSON',
      {
        policyId,
        locationId,
      },
      e
    );
  }

  if (!policyId || !locationId || typeof policyId !== 'string' || typeof locationId !== 'string') {
    reportEndorsementError(`Missing policy and/or location ID`, {
      policyId,
      locationId,
    });
    return; // TODO: report error
  }

  const db = getFirestore();
  const trxCol = transactionsCollection(db);

  const policy = await fetchPolicyData(db, policyId);
  if (!policy) {
    // warn(`Policy not found. Returning early.`); // TODO: report error
    reportEndorsementError(`Policy not found. Returning early.`, {
      policyId,
      locationId,
    });
    return;
  }

  const location = policy.locations[locationId];
  if (!location) {
    error(`location (${locationId}) not found on policy (${policyId})`);
    reportEndorsementError(`location (${locationId}) not found on policy (${policyId})`, {
      policyId,
      locationId,
    });
    return;
  }

  let prevTrx: Transaction;
  try {
    prevTrx = await fetchPreviousTrx(db, policyId, locationId, premEndorsementPrevTypes);
  } catch (err: any) {
    // error(`No previous transactions found matching query. returning early`, {
    //   policyId,
    //   locationId,
    //   err,
    // });
    // reportErrorSentry(`No previous transactions found matching query. returning early`, {
    //   func: 'endorsementListener',
    //   policyId,
    //   locationId,
    // });
    reportEndorsementError(
      `No previous transactions found matching query. returning early`,
      { policyId, locationId },
      err
    );
    return;
  }

  try {
    const trxId = constructTrxId(policyId, locationId, eventId);
    const trxRef = trxCol.doc(trxId);

    if (!trxExists(trxRef)) {
      const ratingData = await fetchRatingData(db, location.ratingDocId);

      const batch = db.batch();

      const trxTimestamp = Timestamp.now(); // TODO: use booking date ?? (later of now and location eff date)

      const offsetTrxRef = trxCol.doc(`${trxId}-offset`);
      const offsetTrx = getOffsetTrx(
        prevTrx as PremiumTransaction,
        trxTimestamp,
        eventId,
        'endorsement'
      ) as Transaction;
      batch.set(offsetTrxRef, { ...offsetTrx });

      const locationTrx = formatPremiumTrx(
        'endorsement',
        policy,
        location,
        ratingData,
        policyId,
        eventId
      );
      batch.set(trxRef, { ...locationTrx });

      await batch.commit();

      info(`Prem endorsement transactions saved for location ${locationId}`, {
        offsetTrx,
        locationTrx,
      });
    } else {
      warn(`Ignoring event. Transaction already exists ${trxId}`);
    }
  } catch (err: any) {
    // error(`Error saving batched transactions`, { err });
    // reportErrorSentry(err, { func: 'endorsementListener', policyId, locationId });
    reportEndorsementError(`Error saving batched transactions`, { policyId, locationId }, err);
  }

  return;
};

function reportEndorsementError(msg: string, ctx: Record<string, any> = {}, err: any = null) {
  error(msg, { ...ctx, err });
  reportErrorSentry(err || msg, { func: 'endorsementListener', msg, ...ctx });
}
