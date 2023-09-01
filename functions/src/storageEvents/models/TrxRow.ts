import { Product, TransactionType } from '../../common';

export interface TrxRow {
  trxType: TransactionType;
  product: Product;
  policyId: string;
  locationId: string;
  externalId: string;
  term: string;
  bookingDate: string;
  issuingCarrier: string;
  namedInsured: string;
  mailingAddressLine1: string;
  mailingAddressLine2: string;
  mailingCity: string;
  mailingState: string;
  mailingPostal: string;
  homeState: string;
  insuredAddressLine1: string;
  insuredAddressLine2: string;
  insuredCity: string;
  insuredState: string;
  insuredPostal: string;
  insuredCountyFips?: string;
  insuredCountyName?: string;
  latitude: string;
  longitude: string;
  otherInterestedParties: string;
  additionalNamedInsured: string;
  // additionalInsureds: string;
  // mortgageeInterest: string;
  policyEffDate: string;
  policyExpDate: string;
  // locationEffDate: string; // include ?? (not in trx ??)
  // locationExpDate: string; // include ??
  trxEffDate: string;
  trxExpDate: string;
  trxDays: string;
  cancelReason: string; // TODO: include cancelEffDate ?? (only needed in policy location)
  locationTermPremium: string;
  locationAnnualPremium: string;
  // TODO: premiumCalcData (only requires mga comm & DWP (but need to update to include reporting ratio fields))
  mgaCommission: string;
  mgaCommissionPct: string;
  netDirectWrittenPremium: string;
  dailyPremium: string;
  termProratedPct: string;
  netErrorAdj: string;
  surplusLinesTax: string;
  surplusLinesRegulatoryFee: string;
  mgaFee: string;
  inspectionFee: string;
  previousPremiumTrxId: string;
  limitA: string;
  limitB: string;
  limitC: string;
  limitD: string;
  deductible: string;
  ratingDocId: string; // TODO: required ?? created from policy import (review endorsement flow)
  replacementCost: string;
  cbrsDesignation: string;
  basement: string;
  distToCoastFeet: string;
  floodZone: string;
  numStories: string;
  propertyCode: string;
  sqFootage: string;
  yearBuilt: string;
  ffh: string;
  units: string;
  tier1: string;
  construction: string;
  priorLossCount: string;
  techPremiumInland: string;
  techPremiumSurge: string;
  techPremiumTsunami: string;
}
