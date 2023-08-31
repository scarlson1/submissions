import { GeoPoint } from 'firebase-admin/firestore';

import {
  AmendmentTransaction,
  BaseTransaction,
  CancellationReason,
  DeepNullable,
  OffsetTransaction,
  OffsetTrxType,
  PolicyLocation,
  PremTrxType,
  PremiumTransaction,
  Product,
  Transaction,
  extractNumber,
  extractNumberNeg,
} from '../../common';
import { getRCVs } from '../../modules/rating';
import { premEndorsementPrevTypes } from '../../pubsub/endorsementListener';
import { TrxRow } from '../models';
import { csvCellToTimestamp } from './utils';

const offsetTrxTypes: OffsetTrxType[] = ['cancellation', 'endorsement', 'flat_cancel'];
function isOffsetTrx(row: TrxRow) {
  // @ts-ignore
  const isOffsetType = offsetTrxTypes.includes(row.trxType);

  const termPrem = row.locationTermPremium ? extractNumberNeg(row.locationTermPremium) : 0;

  if (isOffsetType && Math.sign(termPrem) === -1) return true;
  return false;
}

function isPremTrx(row: TrxRow) {
  // @ts-ignore
  const isPremType = premEndorsementPrevTypes.includes(row.trxType);

  const termPrem = row.locationTermPremium ? extractNumberNeg(row.locationTermPremium) : 0;

  if (isPremType && Math.sign(termPrem)) return true;
  return false;
}

export type TrxTransformResult = Omit<DeepNullable<Transaction>, 'metadata'>;

export function transformTrxRow(row: TrxRow): TrxTransformResult {
  // switch over trx interface type of transaction and return different functions ?? not created within system so wont know
  // could check if number is negative to assign trxInterfaceType ??
  // need to use trx type

  if (row.trxType === 'amendment') return csvRowToAmendmentTrx(row);

  if (isPremTrx(row)) return csvRowToPremiumTrx(row);

  if (isOffsetTrx(row)) return csvRowToOffsetTrx(row);

  return row as any as TrxTransformResult;
}

// TODO: create abstract mapping config that checks for value, then returns value (passed through optional parsing function), else null ??

function csvRowToOffsetTrx(row: TrxRow): DeepNullable<Omit<OffsetTransaction, 'metadata'>> {
  return {
    ...csvRowCommon(row),
    trxType: row.trxType as OffsetTrxType,
    trxInterfaceType: 'offset',
    insuredLocation: csvRowToInsuredLocation(row) as PolicyLocation,
    termPremium: row.locationTermPremium ? extractNumberNeg(row.locationTermPremium) : null,
    MGACommission: row.mgaCommission ? extractNumberNeg(row.mgaCommission) : null,
    MGACommissionPct: row.mgaCommissionPct ? extractNumberNeg(row.mgaCommissionPct) : null,
    netDWP: row.netDirectWrittenPremium ? extractNumberNeg(row.netDirectWrittenPremium) : null,
    dailyPremium: row.dailyPremium ? extractNumberNeg(row.dailyPremium) : null,
    netErrorAdj: row.netErrorAdj ? extractNumberNeg(row.netErrorAdj) : null,
    surplusLinesTax: row.surplusLinesTax ? extractNumberNeg(row.surplusLinesTax) : null,
    surplusLinesRegulatoryFee: row.surplusLinesRegulatoryFee
      ? extractNumberNeg(row.surplusLinesRegulatoryFee)
      : null,
    MGAFee: row.mgaFee ? extractNumberNeg(row.mgaFee) : null,
    inspectionFee: row.inspectionFee ? extractNumberNeg(row.inspectionFee) : null,
    cancelReason: (row.cancelReason as CancellationReason) || null,
    previousPremiumTrxId: row.previousPremiumTrxId || '',
  };
}

function csvRowToPremiumTrx(row: TrxRow): DeepNullable<Omit<PremiumTransaction, 'metadata'>> {
  const limits = {
    limitA: row.limitA ? extractNumber(row.limitA) : 0,
    limitB: row.limitB ? extractNumber(row.limitB) : 0,
    limitC: row.limitC ? extractNumber(row.limitC) : 0,
    limitD: row.limitD ? extractNumber(row.limitD) : 0,
  };

  const TIV = Object.values(limits).reduce((acc, curr) => acc + curr, 0);

  const RCVs = getRCVs(extractNumber(row.replacementCost || '0'), limits);

  return {
    ...csvRowCommon(row),
    trxType: (row.trxType as PremTrxType) || null,
    trxInterfaceType: 'premium',
    insuredLocation: csvRowToInsuredLocation(row) as PolicyLocation,
    ratingPropertyData: csvRatingPropertyData(row),
    deductible: row.deductible ? extractNumber(row.deductible) : null,
    limits,
    TIV,
    RCVs,
    premiumCalcData: {
      MGACommission: row.mgaCommission ? extractNumberNeg(row.mgaCommission) : null,
      MGACommissionPct: row.mgaCommissionPct ? extractNumber(row.mgaCommissionPct) : null,
      // TODO: rename directWrittenPremium --> annualPremium
      directWrittenPremium: row.locationAnnualPremium
        ? extractNumberNeg(row.locationAnnualPremium)
        : null,
      // TODO: other reporting dependant fields
    },
    locationAnnualPremium: row.locationAnnualPremium
      ? extractNumberNeg(row.locationAnnualPremium)
      : null,
    termPremium: row.locationTermPremium ? extractNumberNeg(row.locationTermPremium) : null,
    MGACommission: row.mgaCommission ? extractNumberNeg(row.mgaCommission) : null,
    MGACommissionPct: row.mgaCommissionPct ? extractNumber(row.mgaCommissionPct) : null,
    netDWP: row.netDirectWrittenPremium ? extractNumberNeg(row.netDirectWrittenPremium) : null,
    dailyPremium: row.dailyPremium ? extractNumberNeg(row.dailyPremium) : null,
    termProratedPct: row.termProratedPct ? extractNumber(row.termProratedPct) : null,
    netErrorAdj: row.netErrorAdj ? extractNumberNeg(row.netErrorAdj) : 0,
    surplusLinesTax: row.surplusLinesTax ? extractNumberNeg(row.surplusLinesTax) : 0,
    surplusLinesRegulatoryFee: row.surplusLinesRegulatoryFee
      ? extractNumberNeg(row.surplusLinesRegulatoryFee)
      : 0,
    MGAFee: row.mgaFee ? extractNumberNeg(row.mgaFee) : 0,
    inspectionFee: row.inspectionFee ? extractNumberNeg(row.inspectionFee) : 0,
    otherInterestedParties: row.otherInterestedParties ? row.otherInterestedParties.split(',') : [],
    additionalNamedInsured: row.additionalNamedInsured ? row.additionalNamedInsured.split(',') : [],
  };
}

function csvRowToAmendmentTrx(row: TrxRow): DeepNullable<Omit<AmendmentTransaction, 'metadata'>> {
  return {
    ...csvRowCommon(row),
    trxType: 'amendment',
    trxInterfaceType: 'amendment',
    policyEffDate: csvCellToTimestamp(row.policyEffDate),
    policyExpDate: csvCellToTimestamp(row.policyExpDate),
    trxEffDate: csvCellToTimestamp(row.trxEffDate),
    trxExpDate: csvCellToTimestamp(row.trxExpDate),
    trxDays: row.trxDays ? extractNumber(row.trxDays) : null,
    insuredLocation: csvRowToInsuredLocation(row) as PolicyLocation,
  };
}

function csvRowToInsuredLocation(row: TrxRow): DeepNullable<Omit<PolicyLocation, 'metadata'>> {
  const lat = row.latitude ? extractNumberNeg(row.latitude) : null;
  const lng = row.longitude ? extractNumberNeg(row.longitude) : null;
  const coordinates = lat && lng ? new GeoPoint(lat, lng) : null;

  const limits = {
    limitA: row.limitA ? extractNumber(row.limitA) : 0,
    limitB: row.limitB ? extractNumber(row.limitB) : 0,
    limitC: row.limitC ? extractNumber(row.limitC) : 0,
    limitD: row.limitD ? extractNumber(row.limitD) : 0,
  };

  const TIV = Object.values(limits).reduce((acc, curr) => acc + curr, 0);
  const RCVs = getRCVs(extractNumber(row.replacementCost || '0'), limits);

  return {
    address: {
      addressLine1: row.insuredAddressLine1 || null,
      addressLine2: row.insuredAddressLine2 || '',
      city: row.insuredCity || null,
      state: row.insuredState || null,
      postal: row.insuredPostal || null,
      countyFIPS: row.insuredCountyFips || null,
      countyName: row.insuredCountyName || null,
    },
    coordinates,
    geoHash: null,
    annualPremium: row.locationAnnualPremium ? extractNumber(row.locationAnnualPremium) : null,
    termPremium: row.locationTermPremium ? extractNumber(row.locationTermPremium) : null,
    termDays: null, // TODO: calc term days from eff and exp dates
    limits,
    TIV,
    RCVs,
    deductible: row.deductible ? extractNumber(row.deductible) : null,
    exists: true,
    additionalInsureds: [], // TODO
    mortgageeInterest: [],
    ratingDocId: row.ratingDocId || null,
    ratingPropertyData: csvRatingPropertyData(row),
    effectiveDate: null,
    expirationDate: null,
    cancelEffDate: null,
    cancelReason: (row.cancelReason as CancellationReason) || null,
    locationId: row.locationId || null,
    externalId: row.externalId || null,
  };
}

function csvRowCommon(row: TrxRow): DeepNullable<Omit<BaseTransaction, 'metadata' | 'trxType'>> {
  return {
    product: (row.product as Product) || null,
    policyId: row.policyId || null,
    locationId: row.locationId || null,
    externalId: row.externalId || null,
    term: row.term ? extractNumber(row.term) : null,
    bookingDate: csvCellToTimestamp(row.bookingDate),
    issuingCarrier: row.issuingCarrier || null,
    namedInsured: row.namedInsured || null, // TODO: reusable func for getting address from csv
    mailingAddress: {
      addressLine1: row.mailingAddressLine1 || null,
      addressLine2: row.mailingAddressLine2 || '',
      city: row.mailingCity || null,
      state: row.mailingState || null,
      postal: row.mailingPostal || null,
    },
    homeState: row.homeState || null,
    policyEffDate: csvCellToTimestamp(row.policyEffDate),
    policyExpDate: csvCellToTimestamp(row.policyExpDate),
    trxEffDate: csvCellToTimestamp(row.trxEffDate),
    trxExpDate: csvCellToTimestamp(row.trxExpDate),
    trxDays: row.trxDays ? extractNumber(row.trxDays) : null,
    eventId: null,
  };
}

function csvRatingPropertyData(row: TrxRow) {
  return {
    replacementCost: row.replacementCost ? extractNumber(row.replacementCost) : null,
    CBRSDesignation: row.cbrsDesignation || null,
    basement: row.basement || null,
    distToCoastFeet: row.distToCoastFeet ? extractNumber(row.distToCoastFeet) : null,
    floodZone: row.floodZone || null,
    numStories: row.numStories ? extractNumber(row.numStories) : null,
    propertyCode: row.propertyCode || null,
    sqFootage: row.sqFootage ? extractNumber(row.sqFootage) : null,
    yearBuilt: row.yearBuilt ? extractNumber(row.yearBuilt) : null,
    FFH: row.ffh ? extractNumber(row.ffh) : null,
    units: row.units ? extractNumber(row.units) : null,
    tier1: row.tier1 ? row.tier1.toLowerCase() === 'true' : null,
    construction: row.construction || null,
    priorLossCount: row.priorLossCount || null,
  };
}
