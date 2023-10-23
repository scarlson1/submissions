import { z } from 'zod';

export const TrxRow = z.object({
  trxType: z.string(), // TransactionType,
  product: z.string(), // Product,
  policyId: z.string(),
  // locationId: string;
  externalId: z.string(),
  term: z.string(),
  bookingDate: z.string(),
  issuingCarrier: z.string(),
  namedInsured: z.string(),
  mailingAddressLine1: z.string(),
  mailingAddressLine2: z.string(),
  mailingCity: z.string(),
  mailingState: z.string(),
  mailingPostal: z.string(),
  homeState: z.string(),
  insuredAddressLine1: z.string(),
  insuredAddressLine2: z.string(),
  insuredCity: z.string(),
  insuredState: z.string(),
  insuredPostal: z.string(),
  insuredCountyFips: z.string().optional(),
  insuredCountyName: z.string().optional(),
  latitude: z.string(),
  longitude: z.string(),
  otherInterestedParties: z.string(),
  additionalNamedInsured: z.string(),
  // additionalInsureds: string;
  // mortgageeInterest: string;
  policyEffDate: z.string(),
  policyExpDate: z.string(),
  // locationEffDate: string; // include ?? (not in trx ??)
  // locationExpDate: string; // include ??
  trxEffDate: z.string(),
  trxExpDate: z.string(),
  trxDays: z.string(),
  cancelReason: z.string(), // TODO: include cancelEffDate ?? (only needed in policy location)
  locationTermPremium: z.string(),
  locationAnnualPremium: z.string(),
  // TODO: premiumCalcData (only requires mga comm & DWP (but need to update to include reporting ratio fields))
  mgaCommission: z.string(),
  mgaCommissionPct: z.string(),
  netDirectWrittenPremium: z.string(),
  dailyPremium: z.string(),
  termProratedPct: z.string(),
  provisionalPremium: z.string(),
  netErrorAdj: z.string(),
  surplusLinesTax: z.string(),
  surplusLinesRegulatoryFee: z.string(),
  mgaFee: z.string(),
  inspectionFee: z.string(),
  previousPremiumTrxId: z.string(),
  limitA: z.string(),
  limitB: z.string(),
  limitC: z.string(),
  limitD: z.string(),
  deductible: z.string(),
  ratingDocId: z.string(), // TODO: required ?? created from policy import (review endorsement flow)
  replacementCost: z.string(),
  cbrsDesignation: z.string(),
  basement: z.string(),
  distToCoastFeet: z.string(),
  floodZone: z.string(),
  numStories: z.string(),
  propertyCode: z.string(),
  sqFootage: z.string(),
  yearBuilt: z.string(),
  ffh: z.string(),
  units: z.string(),
  tier1: z.string(),
  construction: z.string(),
  priorLossCount: z.string(),
  techPremiumInland: z.string(),
  techPremiumSurge: z.string(),
  techPremiumTsunami: z.string(),
});
export type TrxRow = z.infer<typeof TrxRow>;

// export interface TrxRow {
//   trxType: TransactionType;
//   product: Product;
//   policyId: string;
//   // locationId: string;
//   externalId: string;
//   term: string;
//   bookingDate: string;
//   issuingCarrier: string;
//   namedInsured: string;
//   mailingAddressLine1: string;
//   mailingAddressLine2: string;
//   mailingCity: string;
//   mailingState: string;
//   mailingPostal: string;
//   homeState: string;
//   insuredAddressLine1: string;
//   insuredAddressLine2: string;
//   insuredCity: string;
//   insuredState: string;
//   insuredPostal: string;
//   insuredCountyFips?: string;
//   insuredCountyName?: string;
//   latitude: string;
//   longitude: string;
//   otherInterestedParties: string;
//   additionalNamedInsured: string;
//   // additionalInsureds: string;
//   // mortgageeInterest: string;
//   policyEffDate: string;
//   policyExpDate: string;
//   // locationEffDate: string; // include ?? (not in trx ??)
//   // locationExpDate: string; // include ??
//   trxEffDate: string;
//   trxExpDate: string;
//   trxDays: string;
//   cancelReason: string; // TODO: include cancelEffDate ?? (only needed in policy location)
//   locationTermPremium: string;
//   locationAnnualPremium: string;
//   // TODO: premiumCalcData (only requires mga comm & DWP (but need to update to include reporting ratio fields))
//   mgaCommission: string;
//   mgaCommissionPct: string;
//   netDirectWrittenPremium: string;
//   dailyPremium: string;
//   termProratedPct: string;
//   netErrorAdj: string;
//   surplusLinesTax: string;
//   surplusLinesRegulatoryFee: string;
//   mgaFee: string;
//   inspectionFee: string;
//   previousPremiumTrxId: string;
//   limitA: string;
//   limitB: string;
//   limitC: string;
//   limitD: string;
//   deductible: string;
//   ratingDocId: string; // TODO: required ?? created from policy import (review endorsement flow)
//   replacementCost: string;
//   cbrsDesignation: string;
//   basement: string;
//   distToCoastFeet: string;
//   floodZone: string;
//   numStories: string;
//   propertyCode: string;
//   sqFootage: string;
//   yearBuilt: string;
//   ffh: string;
//   units: string;
//   tier1: string;
//   construction: string;
//   priorLossCount: string;
//   techPremiumInland: string;
//   techPremiumSurge: string;
//   techPremiumTsunami: string;
// }
