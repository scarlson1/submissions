import { DocumentReference, Firestore, Timestamp } from 'firebase-admin/firestore';
import { error } from 'firebase-functions/logger';
import { round } from 'lodash';
import { add } from 'date-fns';

import {
  Policy,
  PolicyLocation,
  RatingData,
  Transaction,
  TransactionType,
  getTermDays,
  policiesCollection,
  ratingDataCollection,
  transactionsCollection,
} from '../../common';

/**
 * Check if a transation already exists in database
 * @param {DocumentReference} trxRef doc ref of transaction
 * @returns {boolean} returns boolean indicated if transaction exists for provided ref
 */
export const trxExists = (trxRef: DocumentReference) => {
  return trxRef.get().then((snap) => snap.exists);
};

/**
 * Transaction ID generator for idempotency
 * @param {string} policyId policy ID
 * @param {string} locationId location ID
 * @param {string} eventId cloud function event ID
 * @returns {string} transaction ID constructed using provided params
 */
export const constructTrxId = (policyId: string, locationId: string, eventId: string) =>
  `${policyId}-${locationId}-${eventId}`;

/**
 * Get the book date in milliseconds (later of location eff. date or trx. eff. date)
 * @param locationEffDateSeconds location effective date in milliseconds
 * @param trxEffDateSeconds transaction effective date in milliseconds
 * @returns greater of the two numbers
 */
export const getBookingDate = (locationEffDateSeconds: number, trxEffDateSeconds: number) => {
  return locationEffDateSeconds > trxEffDateSeconds ? locationEffDateSeconds : trxEffDateSeconds;
};

/**
 * Net Direct Written Premium = term prem - mga
 * @param termPremium term premium
 * @param mgaComm MGA commission (in dollars)
 * @returns net direct written premium
 */
export const calcNetDWP = (termPremium: number, mgaComm: number) => termPremium - mgaComm;

/**
 * Calc daily premium, rounded
 * @param {number} termPremium premium between eff. & exp. dates
 * @param {number} termDays days between exp. date and eff. date
 * @param {number} roundTo decimal place for rounding (default = 2)
 * @returns {number} daily premium
 */
export const getDailyPremium = (termPremium: number, termDays: number, roundTo: number = 2) =>
  round(termPremium / termDays, roundTo);

/**
 * Term prorated percent formula
 * @param {number} policyTermDays days between policy exp. date and policy eff. date
 * @param {number} locationTermDays days between location exp. date and location eff. date
 * @returns {number} ratio of location term days to policy term days
 */
export const getTermProratedPct = (policyTermDays: number, locationTermDays: number) =>
  locationTermDays / policyTermDays;

export function formatPremiumTrx(
  trxType: TransactionType,
  policy: Policy,
  location: PolicyLocation,
  ratingData: RatingData,
  policyId: string,
  eventId: string,
  trxTimestamp: Timestamp = Timestamp.now()
): Transaction {
  const trxEffDate = policy?.effectiveDate;

  const bookingDateMillis = getBookingDate(
    location.effectiveDate.toMillis(),
    trxEffDate.toMillis()
  );

  const policyTermDays = getTermDays(
    policy.effectiveDate?.toDate(),
    policy.expirationDate?.toDate()
  );

  const termProratedPct = getTermProratedPct(policyTermDays, location.termDays);
  const dailyPremium = getDailyPremium(location.termPremium, location.termDays);

  return {
    trxType,
    product: policy.product || '',
    policyId,
    term: policy.term,
    trxTimestamp,
    bookingDate: Timestamp.fromMillis(bookingDateMillis),
    issuingCarrier: policy?.issuingCarrier || '',
    namedInsured: policy?.namedInsured?.displayName || '',
    mailingAddress: policy.mailingAddress,
    locationId: location.locationId,
    externalId: location.externalId || null,
    insuredLocation: location,
    policyEffDate: policy.effectiveDate,
    policyExpDate: policy.expirationDate,
    trxEffDate: location.effectiveDate || null,
    trxExpDate: location.expirationDate || null,
    trxDays: location.termDays,
    cancelEffDate: null,
    ratingPropertyData: {
      ...location.ratingPropertyData,
      units: null,
      tier1: null,
      construction: '',
      priorLossCount: location.ratingPropertyData?.priorLossCount ?? null,
    }, // TODO: needs units, tier1, construction from property res
    deductible: location.deductible,
    limits: location.limits,
    TIV: location.TIV,
    RCVs: location.RCVs,
    premiumCalcData: ratingData.premiumCalcData,
    locationAnnualPremium: location.annualPremium,
    termProratedPct,
    termPremium: location.termPremium,
    MGACommission: ratingData?.premiumCalcData?.MGACommission,
    MGACommissionPct: ratingData.premiumCalcData?.MGACommissionPct,
    netDWP: calcNetDWP(location.termPremium, ratingData?.premiumCalcData?.MGACommission || 0),
    netErrorAdj: 0, // TODO
    dailyPremium,
    otherInterestedParties: location.mortgageeInterest?.map((m) => m.name) || [],
    additionalNamedInsured: location.additionalInsureds?.map((ai) => ai.name) || [],
    homeState: policy.homeState || '',
    eventId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
}

/* 
    - calculate trxEffDate (when action takes effect) from the expiration date of the location to get the # days to offset
    - or subtract trxEffDate - prevTrxEffDate to get earned days. Any benefit of one approach over the other ??
    - 
*/

// policyId: string, locationId: string,
// TODO: reusable for cancellation ??
export const getPremEndorsementOffsetTrx = (prevTrx: Transaction, trxEffDate: Timestamp) => {
  const bookingDateMillis = getBookingDate(prevTrx.trxEffDate.toMillis(), trxEffDate.toMillis());

  // policyTermDWP = -199.00
  // mgaCommission = -67.89
  // netDWP = -131.11
  // trxDays = 1 ??
  // earnedPremium = -199

  const trxExpDate = add(trxEffDate.toDate(), { days: 1 });
  const trxDays = getTermDays(trxEffDate.toDate(), trxExpDate);

  // const termPremium = dailyPremium * (prevExpDate - trxEffDate)
  const remainingDays = getTermDays(trxEffDate.toDate(), prevTrx.trxExpDate.toDate());
  // const termPremium = prevTrx.dailyPremium * remainingDays;

  const termProratedPct = -(remainingDays / prevTrx.trxDays);
  const termPremium = prevTrx.locationAnnualPremium * termProratedPct;
  const MGACommission = prevTrx.MGACommission * termProratedPct;
  const netDWP = prevTrx.netDWP * termProratedPct;

  // TODO: finish setting rest of values
  return {
    // ...prevTrx,
    trxType: 'prem_endorsement_offset' as TransactionType,
    product: prevTrx.product,
    term: prevTrx.term,
    policyId: prevTrx.policyId,
    policyEffDate: prevTrx.policyEffDate,
    policyExpDate: prevTrx.policyExpDate,
    issuingCarrier: prevTrx.issuingCarrier,
    namedInsured: prevTrx.namedInsured,
    mailingAddress: prevTrx.mailingAddress,
    locationId: prevTrx.locationId,
    externalId: prevTrx.externalId,
    insuredLocation: prevTrx.insuredLocation,
    trxEffDate,
    trxExpDate: Timestamp.fromDate(trxExpDate),
    trxDays,
    bookingDate: Timestamp.fromMillis(bookingDateMillis),
    termPremium,
    MGACommission,
    netDWP,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
};

export const fetchPolicyData = async (db: Firestore, policyId: string) => {
  try {
    const policyCol = policiesCollection(db);
    const policyRef = policyCol.doc(policyId);

    const policySnap = await policyRef.get();
    const data = policySnap.data(); //  as unknown as Policy;
    if (policySnap.exists || !data) throw new Error('Policy not found');
    return data;
  } catch (err: any) {
    error(`Error fetching policy (ID: ${policyId})`, { err });
    return null;
  }
};

export const fetchRatingData = async (db: Firestore, docId?: string | undefined | null) => {
  if (!docId) throw new Error('missing rating doc ID');
  const ratingSnap = await ratingDataCollection(db).doc(docId).get();

  const ratingData = ratingSnap.data();
  if (!ratingData) {
    const errMsg = `No rating data found under ID ${docId}`;
    error(errMsg);
    throw new Error(errMsg);
  }

  return ratingData;
};

export async function fetchPreviousTrx(
  db: Firestore,
  policyId: string,
  locationId: string,
  types: TransactionType[]
) {
  const trxCol = transactionsCollection(db);

  let q = trxCol
    .where('policyId', '==', policyId)
    .where('locationId', '==', locationId)
    .where('trxType', 'in', types)
    .orderBy('metadata.created')
    .limit(1);

  const qSnap = await q.get();

  if (qSnap.empty) throw new Error('previous transaction not found');

  return qSnap.docs[0].data();
}
