import { isValid } from 'date-fns';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info, warn } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import {
  OffsetTransaction,
  PremiumTransaction,
  Transaction,
  WithId,
  transactionsCollection,
} from '../common';
import {
  constructTrxId,
  docExists,
  fetchPolicyData,
  fetchPreviousTrx,
  fetchRatingData,
  formatPremiumTrx,
  getOffsetTrx,
} from '../modules/transactions';
import { reportErrorSentry } from '../services/sentry';

// How is removed location handled ??
// assume deleted if location not found in policy ??
// pass sub type in json (remove_location, add_location, edit_location, etc.) ??

// TODO: How is policy level endorsement handled ?? change in mailing address, etc.

// Handles creating transactions whenever a LOCATION premium change event is published (per location)
//    - trx1: offsets the remaining period for the original trx
//    - trx2: new premium for the term

export const premEndorsementPrevTypes: PremiumTransaction['trxType'][] = [
  'new',
  'renewal',
  'reinstatement',
  'endorsement',
];

export interface EndorsementPayload {
  policyId: string;
  locationId: string;
  effDateMS: number;
}

export default async (event: CloudEvent<MessagePublishedData<EndorsementPayload>>) => {
  info('PREM ENDORSEMENT EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  const eventId = event.id;
  let policyId = null;
  let locationId = null;
  let effDateMS = null;

  try {
    policyId = event.data?.message?.json?.policyId;
    locationId = event.data?.message?.json?.locationId;
    effDateMS = event.data?.message?.json?.effDateMS;
  } catch (e) {
    reportEndorsementError('PubSub message was not JSON', {}, e);
  }

  // TODO: validate eff date or default to now ??
  if (!policyId || !locationId || typeof policyId !== 'string' || typeof locationId !== 'string') {
    reportEndorsementError(`Missing policy and/or location ID`, {
      policyId,
      locationId,
      effDateMS,
    });
    return;
  }

  const db = getFirestore();
  const trxCol = transactionsCollection(db);

  const policy = await fetchPolicyData(db, policyId); // TODO: use fetchDocData instead
  if (!policy) {
    reportEndorsementError(`Policy not found or error occurred fetching data. Returning early.`, {
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
    reportEndorsementError(
      `No previous transactions found matching query. returning early.`,
      { policyId, locationId },
      err
    );
    return;
  }

  try {
    const trxId = constructTrxId(policyId, locationId, eventId);
    const trxRef = trxCol.doc(trxId);

    const exists = await docExists(trxRef);
    if (!exists) {
      const ratingData = await fetchRatingData(db, location.ratingDocId);

      const batch = db.batch();

      let trxEffDate =
        effDateMS && isValid(effDateMS) ? Timestamp.fromMillis(effDateMS) : Timestamp.now();

      const offsetTrxRef = trxCol.doc(`${trxId}-offset`);
      const offsetTrx = getOffsetTrx(
        prevTrx as WithId<PremiumTransaction | OffsetTransaction>,
        trxEffDate,
        eventId,
        'endorsement'
      ) as Transaction;
      batch.set(offsetTrxRef, { ...offsetTrx });

      const locationTrx = formatPremiumTrx(
        'endorsement',
        policy,
        location,
        ratingData,
        // policyId,
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
    reportEndorsementError(`Error saving batched transactions`, { policyId, locationId }, err);
  }

  return;
};

function reportEndorsementError(msg: string, ctx: Record<string, any> = {}, err: any = null) {
  error(msg, { ...ctx, err });
  reportErrorSentry(err || msg, { func: 'endorsementListener', msg, ...ctx });
}
