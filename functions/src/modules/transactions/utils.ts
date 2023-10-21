import { add, differenceInCalendarDays } from 'date-fns';
import { DocumentData, DocumentReference, Firestore, Timestamp } from 'firebase-admin/firestore';
import { error } from 'firebase-functions/logger';
import { max, round } from 'lodash-es';
import {
  AmendmentTransaction,
  OffsetTransaction,
  Policy,
  PremiumTransaction,
  StrictExclude,
  Transaction,
  TransactionType,
  WithId,
  policiesCollectionNew,
  ratingDataCollection,
  transactionsCollection,
} from '../../common/index.js';

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
 * Get the book date in milliseconds (later of trx timestamp (created) or trx eff date)
 * @param {number} trxEffDateMS transaction effective date in milliseconds
 * @param {number} locationEffDateMS location or policy eff date in milliseconds
 * @param {number} trxTimestampMS transaction timestamp (created) in milliseconds
 * @returns {Timestamp} timestamp of the latest date
 */
export const getBookingDate = (
  trxEffDateMS: number,
  locationEffDateMS: number,
  trxTimestampMS: number = new Date().getTime()
) => {
  let latest = max([trxEffDateMS, locationEffDateMS, trxTimestampMS]);

  return Timestamp.fromMillis(latest!);
  // return trxTimestampMS > trxEffDateMS ? trxTimestampMS : trxEffDateMS;
};
// TODO: return as timestamp ??

/**
 * Calc daily premium, rounded
 * @param {number} termPremium premium between eff. & exp. dates
 * @param {number} termDays days between exp. date and eff. date
 * @returns {number} daily premium
 */
export const getDailyPremium = (termPremium: number, termDays: number) =>
  round(termPremium / termDays, 2);

/**
 * Term prorated percent formula
 * @param {number} policyTermDays days between policy exp. date and policy eff. date
 * @param {number} locationTermDays days between location exp. date and location eff. date
 * @returns {number} ratio of location term days to policy term days
 */
export const getTermProratedPct = (policyTermDays: number, locationTermDays: number) =>
  locationTermDays / policyTermDays;

/**
 * Calculate the term premium for cancellation or premium endorsement (offset portion) transactions
 * @param {PremiumTransaction} prevTrx most recent premium transaction for location
 * @param {Timestamp} trxEffDate new transaction effective date
 * @returns {number} term premium for cancellation or prem endorsement offset (will usually be negative)
 */
export const getOffsetTermPremium = (
  prevTrx: WithId<PremiumTransaction | OffsetTransaction>,
  trxEffDate: Timestamp
) => {
  // later of requested eff date & policy eff date
  const startDate =
    trxEffDate.toMillis() < prevTrx.trxEffDate.toMillis()
      ? prevTrx.trxEffDate.toDate()
      : trxEffDate.toDate();

  const earnedDays = getTermDays(prevTrx.trxEffDate.toDate(), startDate);
  const earnedPremium = earnedDays * prevTrx.dailyPremium;

  return -round(prevTrx.termPremium - earnedPremium, 2);
};

/**
 * Calc the MGA portion of term premium
 * @param {number} termPremium portion of term premium after the new transaction effective date
 * @param {PremiumTransaction} prevTrx most recent premium transaction for location
 * @returns {number} mga portion of premium after the new trx eff. date (negative)
 */
export const getMGAComm = (
  termPremium: number,
  prevTrx: StrictExclude<Transaction, AmendmentTransaction>
) => round(termPremium * prevTrx.MGACommissionPct, 2);

/**
 * Calc net direct written premium = termPremium - mga
 * @param {number} termPremium term premium
 * @param {number} MGAComm mga commission (in dollars)
 * @returns {number} net direct written premium (term - mga portion)
 */
export const getNetDWP = (termPremium: number, MGAComm: number) => termPremium - MGAComm;

// TODO: reuse function from modules/db ?? (throws instead of returning null)
export const fetchPolicyData = async (db: Firestore, policyId: string) => {
  const policyCol = policiesCollectionNew(db);
  const policyRef = policyCol.doc(policyId);

  return fetchDocData<Policy>(policyRef);

  // try {
  //   const policyCol = policiesCollectionNew(db);
  //   const policyRef = policyCol.doc(policyId);

  //   const policySnap = await policyRef.get();
  //   const data = policySnap.data(); //  as unknown as Policy;
  //   if (!policySnap.exists || !data) throw new Error('Policy not found');
  //   return { ...data, id: policyId };
  // } catch (err: any) {
  //   error(`Error fetching policy (ID: ${policyId})`, { err });
  //   return null;
  // }
};

/**
 * Fetch doc data in circumstance where you don't want to throw for idempotency reasons (no retry)
 * @param {DocumentReference} docRef firestore document reference
 * @returns {Promise<object | null>} returns document data with id, or null if theres an error or not found
 */
export const fetchDocData = async <T = DocumentData>(docRef: DocumentReference<T>) => {
  try {
    const snap = await docRef.get();
    const data = snap.data();
    if (!snap.exists || !data) throw new Error('Record not found');
    return { ...data, id: docRef.id };
  } catch (err: any) {
    error(`Error fetching policy (ID: ${docRef.id})`, { err });
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
    .orderBy('metadata.created', 'desc')
    .limit(1);

  const qSnap = await q.get();

  if (qSnap.empty) throw new Error('previous transaction not found');

  const data = { ...qSnap.docs[0].data(), id: qSnap.docs[0].id };

  if (data.trxInterfaceType === 'premium') {
    return data as WithId<PremiumTransaction>;
  }
  if (data.trxInterfaceType === 'offset') return data as WithId<OffsetTransaction>;
  if (data.trxInterfaceType === 'amendment') return data as WithId<AmendmentTransaction>;

  return data as WithId<Transaction>;
}

/**
 * number of days between the two days (time is removed from dates). Will return negative value if effDate is larger than expDate
 * @param {Date} effDate effective date
 * @param {Date} expDate expiration date
 * @returns {number} number of days between the days (time removed)
 */
export function getTermDays(effDate: Date, expDate: Date) {
  return differenceInCalendarDays(expDate, effDate);
}

// (trxExpDate - trxEffDate)/(trxExpDate - Year(1))*Annual Premium = Term Premium

// Daily premium = roundup(Term Premium/ (trxExpDate-trxEffDate),2)

/**
 * calc term premium and term days
 * @param {number} annualPremium annual premium for location
 * @param {Date} trxEffDate location eff date
 * @param {Date} trxExpDate location exp date
 * @returns {object} returns termPremium and termDays as numbers
 */
export function calcTerm(annualPremium: number, trxEffDate: Date, trxExpDate: Date) {
  const termDays = getTermDays(trxEffDate, trxExpDate);
  const yearDays = getTermDays(add(trxExpDate, { years: -1 }), trxExpDate);

  const termPremium = round((termDays / yearDays) * annualPremium, 2);

  return { termDays, termPremium };
}

// /**
//  * calc term premium and term days
//  * @param {number} annualPremium annual premium for location
//  * @param {Date} effDate location eff date
//  * @param {Date} expDate location exp date
//  * @returns {object} returns termPremium and termDays as numbers
//  */
// export function calcTermPremium(annualPremium: number, effDate: Date, expDate: Date) {
//   const termDays = getTermDays(effDate, expDate);

//   const dailyAnnualPremium = annualPremium / 365;
//   const termPremium = ceil(dailyAnnualPremium * termDays);

//   return { termDays, termPremium };
// }
