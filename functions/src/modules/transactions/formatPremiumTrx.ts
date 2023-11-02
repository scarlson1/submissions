import { Timestamp } from 'firebase-admin/firestore';
import { ILocation, Policy, PremiumTransaction, RatingData, WithId } from '../../common/index.js';
import {
  getBillingEntityDetails,
  getBillingEntityId,
  getBillingEntityTotals,
} from '../../utils/index.js';
import {
  getBookingDate,
  getDailyPremium,
  getNetDWP,
  getTermDays,
  getTermProratedPct,
  getTrxTaxesAndFees,
} from './index.js';

export function formatPremiumTrx(
  trxType: PremiumTransaction['trxType'],
  policy: WithId<Policy>,
  location: ILocation, // TODO: wrap in WithId ?? in case "locationId" gets removed from interface ??
  ratingData: RatingData,
  trxEffDate: Timestamp,
  eventId: string
): PremiumTransaction {
  const bookingDate = getBookingDate(trxEffDate.toMillis(), location.effectiveDate.toMillis());

  const policyTermDays = getTermDays(
    policy.effectiveDate?.toDate(),
    policy.expirationDate?.toDate()
  );

  const termProratedPct = getTermProratedPct(policyTermDays, location.termDays);
  const dailyPremium = getDailyPremium(location.termPremium, location.termDays);

  const { surplusLinesTax, surplusLinesRegulatoryFee, MGAFee, inspectionFee } =
    getTrxTaxesAndFees(policy);

  const billingEntityId = getBillingEntityId(policy, location.locationId) || 'namedInsured';
  const billingEntity = getBillingEntityDetails(policy, location.locationId);
  const billingEntityTotals = getBillingEntityTotals(policy, location.locationId) || null;

  return {
    trxType,
    trxInterfaceType: 'premium',
    product: policy.product || '',
    policyId: policy.id,
    term: policy.term,
    bookingDate,
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
      ...location.ratingPropertyData, // @ts-ignore
      units: location.ratingPropertyData?.units ?? null, // @ts-ignore
      tier1: location.ratingPropertyData?.tier1 ?? null, // @ts-ignore
      construction: location.ratingPropertyData?.construction ?? null,
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
    MGACommissionPct: ratingData.premiumCalcData?.MGACommissionPct ?? null,
    netDWP: getNetDWP(location.termPremium, ratingData?.premiumCalcData?.MGACommission || 0),
    netErrorAdj: 0, // TODO: where is this coming from ??
    dailyPremium,
    surplusLinesTax,
    surplusLinesRegulatoryFee,
    MGAFee,
    inspectionFee,
    billingEntityId,
    billingEntity,
    billingEntityTotals,
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
