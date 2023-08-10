import { Timestamp } from 'firebase-admin/firestore';

import { getBookingDate, getDailyPremium, getNetDWP, getTermProratedPct } from './index.js';
import {
  Policy,
  PolicyLocation,
  PremiumTransaction,
  RatingData,
  WithId,
  getTermDays,
} from '../../common';

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
