import { GeoPoint } from 'firebase-admin/firestore';

import {
  AgencyDetails,
  AgentDetails,
  FeeItem,
  FeeItemName,
  Nullable,
  Policy,
  RatingPropertyData,
  SubjectBaseItems,
  TaxItem,
  TaxItemName,
  ValueByRiskType,
  extractNumber,
  extractNumberNeg,
} from '../../common';
import { getRCVs } from '../../modules/rating';
import { dateWithTimeZone } from '../../modules/storage';
import { CSVPolicyRow, CSVQuoteRow, ParsedPolicyRow } from '../models';

/** Converts to correct type and unflattens
 * @param {CSVPolicyRow} row raw input from csv
 * @returns {ParsedPolicyRow} formatted types, depth, etc.
 */
export function transformPolicyRow(row: CSVPolicyRow): ParsedPolicyRow {
  console.log('ROW: ', row);
  const limits = {
    limitA: row.limitA ? extractNumber(row.limitA) : 0,
    limitB: row.limitB ? extractNumber(row.limitB) : 0,
    limitC: row.limitC ? extractNumber(row.limitC) : 0,
    limitD: row.limitD ? extractNumber(row.limitD) : 0,
  };

  const TIV = Object.values(limits).reduce((acc, curr) => acc + curr, 0);

  const RCVs = getRCVs(extractNumber(row.replacementCost || '0'), limits);

  const displayName = row.displayName ?? `${row.firstName || ''} ${row.lastName || ''}`.trim();

  const namedInsured: any = {
    displayName,
    email: row.email || '',
    phone: row.phone || '',
    userId: row.userId || null,
  };
  if (row.firstName) namedInsured.firstName = row.firstName;
  if (row.lastName) namedInsured.lastName = row.lastName;
  if (row.orgId) namedInsured.orgId = row.orgId;

  const agent: AgentDetails = {
    userId: row.agentId || null,
    name: row.agentName || '',
    email: row.agentEmail || '',
    phone: row.agentPhone || null,
  };

  const agency: AgencyDetails = {
    orgId: row.agencyId || '',
    name: row.agencyName || '',
    address: {
      addressLine1: row.agencyAddressLine1 || '',
      addressLine2: row.agencyAddressLine2 || '',
      city: row.agencyCity || '',
      state: row.agencyState || '',
      postal: row.agencyPostal || '',
    },
  };

  const ratingPropertyData: RatingPropertyData = {
    CBRSDesignation: row.cbrsDesignation || '',
    basement: row.basement || '',
    distToCoastFeet: row.distToCoastFeet ? extractNumber(row.distToCoastFeet) : 0,
    floodZone: row.floodZone || '',
    numStories: row.numStories ? extractNumber(row.numStories) : 0,
    propertyCode: row.propertyCode || '',
    replacementCost: row.replacementCost ? extractNumber(row.replacementCost) : 0,
    sqFootage: row.sqFootage ? extractNumber(row.sqFootage) : 0,
    yearBuilt: row.yearBuilt ? extractNumber(row.yearBuilt) : 0,
  };
  if (row.ffh) ratingPropertyData.FFH = extractNumber(row.ffh);

  const latitude = row.latitude ? extractNumberNeg(row.latitude) : null;
  const longitude = row.longitude ? extractNumberNeg(row.longitude) : null;
  const coordinates = latitude && longitude ? new GeoPoint(latitude, longitude) : null;

  const price = row.policyPrice ? extractNumber(row.policyPrice) : null;

  const fees = getFormattedFees(row);
  const taxes = getFormattedTaxes(row);

  const mgaCommissionPct = row.mgaCommissionPct ? extractNumber(row.mgaCommissionPct) : null;

  const AALs = {
    inland: row.aalInland
      ? extractNumber(row.aalInland)
      : row.aalInland === 'null'
      ? null
      : undefined,
    surge: row.aalSurge ? extractNumber(row.aalSurge) : row.aalSurge === 'null' ? null : undefined,
    tsunami: row.aalTsunami
      ? extractNumber(row.aalTsunami)
      : row.aalTsunami === 'null'
      ? null
      : undefined,
  } as Nullable<ValueByRiskType>;

  const techPremium = {
    inland: row.techPremiumInland ? extractNumber(row.techPremiumInland) : null,
    surge: row.techPremiumSurge ? extractNumber(row.techPremiumSurge) : null,
    tsunami: row.techPremiumTsunami ? extractNumber(row.techPremiumTsunami) : null,
  };

  const transformed: ParsedPolicyRow = {
    policyId: row.policyId || null,
    address: {
      addressLine1: row.addressLine1 || null,
      addressLine2: row.addressLine2 || '',
      city: row.city || null,
      state: row.state || null,
      postal: row.postal || null,
      countyName: row.countyName || '',
      countyFIPS: row.fips || '',
    },
    coordinates,
    homeState: row.homeState || null,
    deductible: row.deductible ? extractNumber(row.deductible) : 0,
    limits,
    TIV,
    RCVs,
    fees,
    taxes,
    annualPremium: row.annualPremium ? extractNumber(row.annualPremium) : 0,
    price,
    effectiveDate: dateWithTimeZone(row.locationEffectiveDate),
    expirationDate: dateWithTimeZone(row.locationExpirationDate), // row.locationExpirationDate ? new Date(row.locationExpirationDate) : null,
    policyEffectiveDate: dateWithTimeZone(row.policyEffectiveDate),
    policyExpirationDate: dateWithTimeZone(row.policyExpirationDate), // row.policyExpirationDate ? new Date(row.policyExpirationDate) : null,
    cancelEffDate: dateWithTimeZone(row.cancelEffectiveDate),
    externalId: row.locationId, // row.externalId || // TODO: use locationId as header name or externalId ??
    additionalInsured: [],
    mortgageeInterest: [],
    term: row.term ? extractNumber(row.term) : 1,
    namedInsured,
    userId: row.userId || null,
    agent,
    agency,
    ratingPropertyData,
    product: row.product || 'flood',
    mgaCommissionPct,
    AALs: AALs,
    techPremium,
  };
  return transformed;
}

export function getFormattedFees(row: CSVPolicyRow | CSVQuoteRow) {
  const fees: FeeItem[] = [];
  const fee1: FeeItem = {
    feeName: (row.fee1Name || '') as FeeItemName,
    value: row.fee1Value ? extractNumber(row.fee1Value) : 0,
  };
  const fee2: FeeItem = {
    feeName: (row.fee2Name || '') as FeeItemName,
    value: row.fee2Value ? extractNumber(row.fee2Value) : 0,
  };
  if (fee1.value) fees.push(fee1);
  if (fee2.value) fees.push(fee2);

  return fees;
}

export function getFormattedTaxes(row: CSVPolicyRow) {
  const taxes: Policy['taxes'] = [];
  const tax1: TaxItem = {
    displayName: (row.tax1Name || '') as TaxItemName,
    value: row.tax1Value ? extractNumber(row.tax1Value) : 0,
    rate: row.tax1Rate
      ? extractNumber(row.tax1Rate)
      : row.tax1Value
      ? extractNumber(row.tax1Value)
      : 0,
    subjectBase: row.tax1SubjectBase ? (row.tax1SubjectBase.split(',') as SubjectBaseItems[]) : [],
  };
  const tax2: TaxItem = {
    displayName: (row.tax2Name || '') as TaxItemName,
    value: row.tax2Value ? extractNumber(row.tax2Value) : 0,
    rate: row.tax2Rate
      ? extractNumber(row.tax2Rate)
      : row.tax2Value
      ? extractNumber(row.tax2Value)
      : 0,
    subjectBase: row.tax2SubjectBase ? (row.tax2SubjectBase.split(',') as SubjectBaseItems[]) : [],
  };
  if (tax1.value) taxes.push(tax1);
  if (tax2.value) taxes.push(tax2);

  return taxes;
}
