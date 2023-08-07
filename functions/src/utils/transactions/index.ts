import { DocumentData, DocumentReference, Firestore, Timestamp } from 'firebase-admin/firestore';
import { error } from 'firebase-functions/logger';
import { round } from 'lodash';
import { add } from 'date-fns';

import {
  AmendmentTransaction,
  CancellationReason,
  OffsetTransaction,
  Policy,
  PolicyLocation,
  PremiumTransaction,
  RatingData,
  StrictExclude,
  Transaction,
  TransactionType,
  WithId,
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
export const getOffsetTermPremium = (prevTrx: PremiumTransaction, trxEffDate: Timestamp) => {
  const earnedDays = getTermDays(prevTrx.trxEffDate.toDate(), trxEffDate.toDate());
  const earnedPremium = earnedDays * prevTrx.dailyPremium;

  return -round(prevTrx.termPremium - earnedPremium, 2);
};

/**
 * Calc the MGA portion of term premium
 * @param {number} termPremium portion of term premium after the new transaction effective date
 * @param {PremiumTransaction} prevTrx most recent premium tranaction for location
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

export function formatPremiumTrx(
  trxType: PremiumTransaction['trxType'],
  policy: WithId<Policy>,
  location: PolicyLocation,
  ratingData: RatingData,
  // policyId: string,
  eventId: string
  // trxEffDate: Timestamp = Timestamp.now()
): PremiumTransaction {
  // const trxEffDate = policy?.effectiveDate; // or is trxEffDate the later of location Eff date, policy Eff date and now ??
  const trxEffDate = location.effectiveDate;

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
    policyId: policy.id,
    term: policy.term,
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
    netDWP: getNetDWP(location.termPremium, ratingData?.premiumCalcData?.MGACommission || 0),
    netErrorAdj: 0, // TODO: where is this coming from ??
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

/**
 * get formatted offset transaction for cancellation or premium endorsement transactions
 * @param {PremiumTransaction} prevTrx most recent premium transaction for location
 * @param {Timestamp} trxEffDate new transaction effective date
 * @returns {OffsetTransaction} offsetting transaction for cancellation or premium endorsement transactions
 */
export const getOffsetTrx = (
  prevTrx: PremiumTransaction,
  trxEffDate: Timestamp,
  eventId: string,
  trxType: OffsetTransaction['trxType'],
  cancelReason: CancellationReason | null = null
): OffsetTransaction => {
  const bookingDateMillis = getBookingDate(prevTrx.trxEffDate.toMillis(), trxEffDate.toMillis());

  const trxExpDate = add(trxEffDate.toDate(), { days: 1 });
  const trxDays = 1;

  // term premium is negative in offset trx (premium uncollected b/c after change/cancel date)
  const termPremium = getOffsetTermPremium(prevTrx, trxEffDate); // negative
  const MGACommission = getMGAComm(termPremium, prevTrx); // negative
  const netDWP = getNetDWP(termPremium, MGACommission); // negative

  const dailyPremium = termPremium / trxDays;

  return {
    trxType,
    product: prevTrx.product,
    term: prevTrx.term,
    policyId: prevTrx.policyId,
    policyEffDate: prevTrx.policyEffDate,
    policyExpDate: prevTrx.policyExpDate,
    issuingCarrier: prevTrx.issuingCarrier,
    namedInsured: prevTrx.namedInsured,
    mailingAddress: prevTrx.mailingAddress,
    homeState: prevTrx.homeState || '',
    locationId: prevTrx.locationId,
    externalId: prevTrx.externalId,
    insuredLocation: prevTrx.insuredLocation,
    trxEffDate,
    trxExpDate: Timestamp.fromDate(trxExpDate),
    trxDays,
    bookingDate: Timestamp.fromMillis(bookingDateMillis),
    termPremium,
    MGACommission,
    MGACommissionPct: prevTrx.MGACommissionPct,
    netDWP,
    dailyPremium,
    cancelReason,
    eventId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
};

export const getReinstatementTrx = (
  policy: WithId<Policy>,
  location: PolicyLocation,
  prevTrx: OffsetTransaction,
  eventId: string
): PremiumTransaction => {
  const trxEffDate = prevTrx.trxEffDate;
  const trxExpDate = location.expirationDate; // TODO: verify correct date being used
  const trxDays = getTermDays(trxEffDate.toDate(), trxExpDate.toDate());

  const bookingDate = getBookingDate(location.effectiveDate.toMillis(), trxEffDate.toMillis());

  // TODO: decide whether to calculate or use the term premium from location ?? need to recalc in reinstatement handler before emitting policy.reinstated event
  const termPremium = round(trxDays * prevTrx.dailyPremium, 2);
  const MGACommission = getMGAComm(termPremium, prevTrx);

  return {
    trxType: 'reinstatement',
    product: policy.product,
    policyId: policy.id,
    locationId: location.locationId,
    externalId: location.externalId || null,
    term: policy.term,
    issuingCarrier: policy.issuingCarrier,
    namedInsured: policy.namedInsured.displayName,
    mailingAddress: policy.mailingAddress,
    insuredLocation: location,
    homeState: policy.homeState,
    policyEffDate: policy.effectiveDate,
    policyExpDate: policy.expirationDate,
    deductible: location.deductible,
    limits: location.limits,
    TIV: location.TIV,
    RCVs: location.RCVs,
    ratingPropertyData: {
      ...location.ratingPropertyData,
      units: 1,
      tier1: false,
      construction: '',
      priorLossCount: location.ratingPropertyData?.priorLossCount ?? null,
    }, // @ts-ignore
    premiumCalcData: null, // TODO: need to fetch from rating data doc.
    locationAnnualPremium: location.annualPremium,
    termPremium,
    MGACommission,
    trxEffDate,
    trxExpDate,
    trxDays,
    bookingDate: Timestamp.fromMillis(bookingDate),
    otherInterestedParties: location.mortgageeInterest.map((m) => m.name),
    additionalNamedInsured: location.additionalInsureds.map((ai) => ai.name),
    eventId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
};

export const getLocationAmendmentTrx = (
  policy: WithId<Policy>,
  location: PolicyLocation,
  eventId: string
): AmendmentTransaction => {
  return {
    trxType: 'amendment',
    product: policy.product,
    policyId: policy.id,
    locationId: location.locationId,
    externalId: location.externalId || null,
    term: policy.term,
    bookingDate: Timestamp.now(),
    issuingCarrier: policy.issuingCarrier,
    namedInsured: policy.namedInsured.displayName,
    mailingAddress: policy.mailingAddress,
    insuredLocation: location,
    homeState: policy.homeState,
    policyEffDate: policy.effectiveDate,
    policyExpDate: policy.expirationDate,
    trxEffDate: Timestamp.now(),
    trxExpDate: location.expirationDate,
    trxDays: getTermDays(new Date(), location.expirationDate.toDate()),
    otherInterestedParties: location.mortgageeInterest.map((m) => m.name),
    additionalNamedInsured: location.additionalInsureds.map((ai) => ai.name),
    eventId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
};

// trxEffDates:
//    - policy amendment: user
//    - location amendment: user
//    - renewal: location effective date
//    - new: location effective date
//    - cancel: cancellation date
//    - endorsement offset trx: current date
//    - endorsement trx: user, subject to 15 day validation
//    - reinstatement - eff date = cancellation date of previous trx
//        - term premium = daily prem * (exp. date - cancellation date (ie trxEffDate))

export const getPolicyAmendmentTrx = (
  policy: WithId<Policy>,
  eventId: string
): AmendmentTransaction => {
  return {
    trxType: 'amendment',
    product: policy.product,
    policyId: policy.id,
    locationId: '',
    externalId: '',
    term: policy.term,
    bookingDate: Timestamp.now(),
    issuingCarrier: policy.issuingCarrier,
    namedInsured: policy.namedInsured.displayName,
    mailingAddress: policy.mailingAddress,
    homeState: policy.homeState,
    policyEffDate: policy.effectiveDate,
    policyExpDate: policy.expirationDate,
    trxEffDate: Timestamp.now(),
    trxExpDate: policy.expirationDate,
    trxDays: getTermDays(new Date(), policy.expirationDate.toDate()),
    eventId,
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
    if (!policySnap.exists || !data) throw new Error('Policy not found');
    return { ...data, id: policyId };
  } catch (err: any) {
    error(`Error fetching policy (ID: ${policyId})`, { err });
    return null;
  }
};

/**
 * Fetch doc data in circumstance where you don't want to throw for idempotency reasons (no retry)
 * @param docRef firestore document reference
 * @returns {Promise<object | null>} returns document data with id, or null if theres an error or not found
 */
export const fetchDocData = async <T = DocumentData>(docRef: DocumentReference<T>) => {
  try {
    const snap = await docRef.get();
    const data = snap.data();
    if (!snap.exists || !data) throw new Error('Policy not found');
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
    .orderBy('metadata.created')
    .limit(1);

  const qSnap = await q.get();

  if (qSnap.empty) throw new Error('previous transaction not found');

  return qSnap.docs[0].data();
}
