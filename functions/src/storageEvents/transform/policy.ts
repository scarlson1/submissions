import {
  AdditionalInsured,
  AgencyDetails,
  AgentDetails,
  Basement,
  CBRSDesignation,
  FeeItem,
  FeeItemName,
  FloodZone,
  MailingAddress,
  Mortgagee,
  Nullable,
  Policy,
  PriorLossCount,
  RatingPropertyData,
  State,
  SubjectBaseItem,
  TaxItem,
  TaxItemName,
  ValueByRiskType,
} from '@idemand/common';
import { GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { lowerCase, upperCase } from 'lodash-es';
import { extractNumber, extractNumberNeg } from '../../common/index.js';
import { createDocId } from '../../modules/db/utils.js';
import { getRCVs } from '../../modules/rating/index.js';
import { dateWithTimeZone } from '../../modules/storage/index.js';
import { capitalizeFirst } from '../../utils/index.js';
import { NullablePolicyRow } from '../models/ParsedPolicyRow.js';
import { CSVPolicyRow, CSVQuoteRow, ParsedPolicyRow } from '../models/index.js';

const billingEntitiesMap = new Map();

/** Converts to correct type and unflattens
 * @param {CSVPolicyRow} row raw input from csv
 * @returns {ParsedPolicyRow} formatted types, depth, etc.
 */
export function transformPolicyRow(row: CSVPolicyRow): NullablePolicyRow {
  // console.log('ROW: ', row);
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

  const mailingAddress: Nullable<MailingAddress> = {
    name: row.mailingName,
    addressLine1: row.mailingAddressLine1,
    addressLine2: row.mailingAddressLine2,
    city: row.mailingCity,
    state: row.mailingState,
    postal: row.mailingPostal,
  };

  const agent: AgentDetails = {
    userId: (row.agentId || null) as string,
    name: row.agentName || '',
    email: row.agentEmail || '',
    phone: row.agentPhone || null,
  };

  // TODO: add to stripe id to import
  const agency: AgencyDetails = {
    orgId: row.agencyId || '', // @ts-ignore
    stripeAccountId: row.agencyStripeAccountId || '',
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
    CBRSDesignation: row.cbrsDesignation
      ? (upperCase(row.cbrsDesignation) as CBRSDesignation)
      : ('' as CBRSDesignation),
    basement: row.basement ? (lowerCase(row.basement) as Basement) : 'unknown',
    distToCoastFeet: row.distToCoastFeet ? extractNumber(row.distToCoastFeet) : 0,
    floodZone: (row.floodZone ? upperCase(row.floodZone) : '') as FloodZone,
    numStories: row.numStories ? extractNumber(row.numStories) : 0,
    propertyCode: row.propertyCode || '',
    replacementCost: row.replacementCost ? extractNumber(row.replacementCost) : 0,
    sqFootage: row.sqFootage ? extractNumber(row.sqFootage) : 0,
    yearBuilt: row.yearBuilt ? extractNumber(row.yearBuilt) : 0,
    priorLossCount: (row.priorLossCount as PriorLossCount) ?? '0',
    units: row.units ? extractNumber(row.units) : null,
    FFH: row.ffh ? extractNumber(row.ffh) : null,
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

  let additionalInsureds: ParsedPolicyRow['additionalInsureds'] = getAdditionalInsureds(row);
  let mortgageeInterest: ParsedPolicyRow['mortgageeInterest'] = getMortgagee(row);

  const billingEntityName = row.displayName || 'unknown';
  let billingEntityId = billingEntityName ? billingEntitiesMap.get(billingEntityName) : null;

  if (!billingEntityId) {
    billingEntityId = createDocId(5);
    billingEntitiesMap.set(billingEntityName, billingEntityId);
  }

  const transformed = {
    // : ParsedPolicyRow
    policyId: row.policyId || null,
    address: {
      addressLine1: row.addressLine1 ? capitalizeFirst(row.addressLine1) : null,
      addressLine2: row.addressLine2 || '',
      city: row.city ? capitalizeFirst(row.city) : null,
      state: row.state ? upperCase(row.state) : null,
      postal: row.postal || null,
      countyName: row.countyName || '',
      countyFIPS: row.fips || '',
    },
    mailingAddress,
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
    expirationDate: dateWithTimeZone(row.locationExpirationDate),
    policyEffectiveDate: dateWithTimeZone(row.policyEffectiveDate),
    policyExpirationDate: dateWithTimeZone(row.policyExpirationDate),
    cancelEffDate: dateWithTimeZone(row.cancelEffectiveDate),
    cancelReason: row.cancelReason || null,
    externalId: row.locationId,
    additionalInsureds,
    mortgageeInterest,
    term: row.term ? extractNumber(row.term) : 1,
    namedInsured,
    userId: row.userId || null,
    agent,
    agency,
    ratingPropertyData,
    ratingDocId: row.ratingDocId || null,
    product: row.product ? row.product.toLowerCase() : 'flood',
    mgaCommissionPct,
    AALs,
    techPremium,
    billingEntityId,
    billingEntityName,
  };
  // TODO: fix typing & delete as assertion
  return transformed as unknown as NullablePolicyRow;
}

export function getFormattedFees(row: CSVPolicyRow | CSVQuoteRow) {
  const fees: FeeItem[] = [];
  const fee1: FeeItem = {
    displayName: (row.fee1Name || '') as FeeItemName,
    value: row.fee1Value ? extractNumber(row.fee1Value) : 0,
    refundable: row.fee1Name !== FeeItemName.Enum['Inspection Fee'],
  };
  const fee2: FeeItem = {
    displayName: (row.fee2Name || '') as FeeItemName,
    value: row.fee2Value ? extractNumber(row.fee2Value) : 0,
    refundable: row.fee1Name !== FeeItemName.Enum['Inspection Fee'],
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
    subjectBase: row.tax1SubjectBase ? (row.tax1SubjectBase.split(',') as SubjectBaseItem[]) : [],
    baseDigits: 2, // TODO: include in csv
    resultDigits: 2,
    resultRoundType: 'nearest',
    taxId: '', // TODO: fix type (require in import row ??)
    taxCalcId: '',
    refundable: true,
    state: row.homeState as State,
    subjectBaseAmount: 0, // TODO: fix
    transactionTypes: [
      'new',
      'endorsement',
      'amendment',
      'cancellation',
      'flat_cancel',
      'reinstatement',
      'renewal',
    ],
    expirationDate: Timestamp.fromDate(new Date('01/01/2050')),
    calcDate: Timestamp.now(),
  };
  const tax2: TaxItem = {
    displayName: (row.tax2Name || '') as TaxItemName,
    value: row.tax2Value ? extractNumber(row.tax2Value) : 0,
    rate: row.tax2Rate
      ? extractNumber(row.tax2Rate)
      : row.tax2Value
      ? extractNumber(row.tax2Value)
      : 0,
    subjectBase: row.tax2SubjectBase ? (row.tax2SubjectBase.split(',') as SubjectBaseItem[]) : [],
    baseDigits: 2, // TODO: include in csv
    resultDigits: 2,
    resultRoundType: 'nearest',
    taxId: '', // TODO: fix type (require in import row ??)
    taxCalcId: '',
    refundable: true,
    state: row.homeState as State,
    subjectBaseAmount: 0, // TODO: fix
    transactionTypes: [
      'new',
      'endorsement',
      'amendment',
      'cancellation',
      'flat_cancel',
      'reinstatement',
      'renewal',
    ],
    expirationDate: Timestamp.fromDate(new Date('01/01/2050')),
    calcDate: Timestamp.now(),
  };
  if (tax1.value) taxes.push(tax1);
  if (tax2.value) taxes.push(tax2);

  return taxes;
}

function getAdditionalInsureds(row: CSVPolicyRow) {
  let additionalInsureds: AdditionalInsured[] = [
    {
      name: row.additionalInsured1Name,
      email: row.additionalInsured1Email,
    },
    {
      name: row.additionalInsured2Name,
      email: row.additionalInsured2Email,
    },
  ];

  return additionalInsureds.filter((ai) => ai.name);
}

function getMortgagee(row: CSVPolicyRow) {
  const mortgagee: Mortgagee[] = [
    {
      name: row.mortgageeName,
      contactName: row.mortgageeContactName,
      loanNumber: row.mortgageeLoanNumber,
      email: row.mortgageeEmail,
      address: {
        addressLine1: row.mortgageeAddressLine1,
        addressLine2: row.mortgageeAddressLine2,
        city: row.mortgageeCity,
        state: row.mortgageeState,
        postal: row.mortgageePostal,
      },
    },
  ];
  return mortgagee.filter((m) => m.name);
}
