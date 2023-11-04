import { isValid } from 'date-fns';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
// import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { info, warn } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import {
  ILocation,
  OffsetTransaction,
  Policy,
  PremiumTransaction,
  Transaction,
  WithId,
  getReportErrorFn,
  locationsCollection,
  transactionsCollection,
} from '../common/index.js';
import { docExists } from '../modules/db/index.js';
import {
  constructTrxId,
  fetchPolicyData,
  fetchPreviousTrx,
  fetchRatingData,
  formatPremiumTrx,
  getOffsetTrx,
} from '../modules/transactions/index.js';
import { verify } from '../utils/index.js';

// Handles creating transactions whenever a location endorsement event is published
//    - trx1: offsets the remaining period for the original trx
//    - trx2: new premium for the term

const reportErr = getReportErrorFn('endorsementListener');

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
    reportErr('PubSub message was not JSON', {}, e);
  }

  const db = getFirestore();
  const locationsCol = locationsCollection(db);
  const trxCol = transactionsCollection(db);
  let policy: WithId<Policy>;
  let location: ILocation;
  let prevTrx: Transaction;

  try {
    verify(policyId && typeof policyId === 'string', 'missing policyId');
    verify(locationId && typeof locationId === 'string', 'missing locationId');
    // TODO: validate/require eff date or default to now ??

    const locationReq = locationsCol.doc(locationId).get();
    const policyReq = fetchPolicyData(db, policyId);
    const prevTrxReq = fetchPreviousTrx(db, policyId, locationId, premEndorsementPrevTypes);

    const [locationSnap, policyRes, trxRes] = await Promise.all([
      locationReq,
      policyReq,
      prevTrxReq,
    ]);

    const lcnData = locationSnap.exists ? locationSnap.data() : null;
    verify(lcnData, 'location record not found');

    verify(policyRes, `Policy not found or error occurred fetching data. Returning early.`);
    policy = policyRes;
    location = lcnData;
    prevTrx = trxRes;
  } catch (err: any) {
    let errMsg = 'validation failed';
    if (err?.message) errMsg = err.message;
    reportErr(errMsg, { policyId, locationId, effDateMS });
    return;
  }

  try {
    const trxId = constructTrxId(policyId, locationId, eventId);
    const trxRef = trxCol.doc(trxId);

    const exists = await docExists(trxRef);
    if (!exists) {
      const ratingData = await fetchRatingData(db, location.ratingDocId);

      const batch = db.batch();

      const trxEffDate =
        effDateMS && isValid(effDateMS) ? Timestamp.fromMillis(effDateMS) : Timestamp.now();

      const offsetTrxRef = trxCol.doc(`${trxId}-offset`);
      const offsetTrx = getOffsetTrx(
        policy,
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
        trxEffDate,
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
    reportErr(`Error saving endorsement batch transactions`, { policyId, locationId }, err);
  }

  return;
};
