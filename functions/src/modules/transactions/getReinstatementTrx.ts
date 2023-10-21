import { Timestamp } from 'firebase-admin/firestore';
import { round } from 'lodash-es';

import {
  ILocation,
  OffsetTransaction,
  Policy,
  PremiumTransaction,
  WithId,
} from '../../common/index.js';
import { getBookingDate, getMGAComm, getTermDays } from './utils.js';

export const getReinstatementTrx = (
  policy: WithId<Policy>,
  location: ILocation,
  prevTrx: OffsetTransaction,
  trxEffDate: Timestamp,
  eventId: string
): PremiumTransaction => {
  const trxExpDate = location.expirationDate; // TODO: verify correct date being used
  const trxDays = getTermDays(trxEffDate.toDate(), trxExpDate.toDate());

  const bookingDate = getBookingDate(trxEffDate.toMillis(), location.effectiveDate.toMillis());

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
    bookingDate,
    otherInterestedParties: location.mortgageeInterest.map((m) => m.name),
    additionalNamedInsured: location.additionalInsureds.map((ai) => ai.name),
    eventId,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
};
