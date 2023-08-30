import { GeoPoint, Timestamp } from 'firebase-admin/firestore';
import {
  DeepNullable,
  Nullable,
  Product,
  QUOTE_STATUS,
  Quote,
  RatingPropertyData,
  extractNumber,
  extractNumberNeg,
  getCardFee,
} from '../../common';
import { CSVQuoteRow } from '../importQuotes';
import { geohashForLocation } from 'geofire-common';
import { getFormattedFees } from '../importPolicies';
import { add, startOfDay } from 'date-fns';

/**
 * Transform csv row to Quote shape
 * @param {CSVQuoteRow} row csv row after headers converted (if header transform provided)
 * @returns {DeepNullable<Quote>} values shaped as quote, null if not provided
 */
export function transformQuoteRow(row: CSVQuoteRow): DeepNullable<Quote> {
  const limits: Quote['limits'] = {
    limitA: row.limitA ? extractNumber(row.limitA) : 0,
    limitB: row.limitB ? extractNumber(row.limitB) : 0,
    limitC: row.limitC ? extractNumber(row.limitC) : 0,
    limitD: row.limitD ? extractNumber(row.limitD) : 0,
  };

  const address: Nullable<Quote['address']> = {
    addressLine1: row.addressLine1 || null,
    addressLine2: row.addressLine2 || null,
    city: row.city || null,
    state: row.state || null,
    postal: row.postal || null,
    countyName: row.countyName || null,
    countyFIPS: row.fips || null,
  };

  const mailingAddress: Nullable<Quote['mailingAddress']> = {
    name: row.mailingAddressName || '',
    addressLine1: row.mailingAddressLine1 || address.addressLine1,
    addressLine2: row.mailingAddressLine2 || address.addressLine2,
    city: row.mailingCity || address.city,
    state: row.mailingState || address.state,
    postal: row.mailingPostal || address.postal,
  };

  const latitude = row.latitude ? extractNumberNeg(row.latitude) : null;
  const longitude = row.longitude ? extractNumberNeg(row.longitude) : null;
  const coordinates = latitude && longitude ? new GeoPoint(latitude, longitude) : null;

  const geoHash = latitude && longitude ? geohashForLocation([latitude, longitude]) : null;

  const ratingPropertyData: Nullable<RatingPropertyData> = {
    CBRSDesignation: row.cbrsDesignation || null,
    basement: row.basement || null,
    distToCoastFeet: row.distToCoastFeet ? extractNumber(row.distToCoastFeet) : null,
    floodZone: row.floodZone || null,
    numStories: row.numStories ? extractNumber(row.numStories) : null,
    propertyCode: row.propertyCode || null,
    replacementCost: row.replacementCost ? extractNumber(row.replacementCost) : null,
    sqFootage: row.sqFootage ? extractNumber(row.sqFootage) : null,
    yearBuilt: row.yearBuilt ? extractNumber(row.yearBuilt) : null,
    FFH: row.ffh ? extractNumber(row.ffh) : null,
    priorLossCount: row.priorLossCount ?? null,
  };

  const namedInsured: Quote['namedInsured'] = {
    firstName: row.firstName || '',
    lastName: row.lastName || '',
    email: row.email || '',
    phone: row.phone || '',
    userId: row.userId || '',
  };

  const agent: Quote['agent'] = {
    name: row.agentName || null,
    email: row.agentEmail || null,
    phone: row.agentPhone || null,
    // phone: row.agentPhone
    //   ? row.agentPhone.length === 9
    //     ? `+1${row.agentPhone}`
    //     : row.agentPhone
    //   : null,
    userId: row.agentId || null,
  };

  const agency: Quote['agency'] = {
    name: row.agencyName || null,
    address: {
      addressLine1: row.agencyAddressLine1,
      addressLine2: row.agencyAddressLine2,
      city: row.agencyCity,
      state: row.agencyState,
      postal: row.agencyPostal,
    },
    orgId: row.orgId,
  };

  const fees = getFormattedFees(row);

  const effDate = row.effectiveDate
    ? new Date(row.effectiveDate)
    : add(startOfDay(new Date()), { days: 16 });

  const quoteExpDate = row.quoteExpirationDate
    ? new Date(row.quoteExpirationDate)
    : add(startOfDay(new Date()), { days: 30 });

  const quoteTotal = row.quoteTotal ? extractNumber(row.quoteTotal) : null;

  const cardFee = quoteTotal ? getCardFee(quoteTotal) : 0;

  return {
    product: (row.product as Product) || null,
    limits,
    deductible: row.deductible ? extractNumber(row.deductible) : 0,
    address,
    homeState: row.homeState || row.state,
    coordinates,
    geoHash,
    mailingAddress,
    fees,
    taxes: [],
    annualPremium: row.annualPremium ? extractNumber(row.annualPremium) : null,
    subproducerCommission: row.subproducerCommission
      ? extractNumber(row.subproducerCommission)
      : null,
    cardFee: cardFee, // TODO: delete card fee ??
    quoteTotal,
    effectiveDate: Timestamp.fromDate(effDate),
    quotePublishedDate: Timestamp.fromDate(startOfDay(new Date())),
    quoteExpirationDate: Timestamp.fromDate(quoteExpDate),
    externalId: row.locationId || null,
    ratingPropertyData,
    userId: row.userId || null,
    namedInsured,
    agent,
    agency,
    additionalInterests: [],
    status: QUOTE_STATUS.AWAITING_USER,
    ratingDocId: row.ratingDocId || '',
    imageURLs: null,
    imagePaths: null,
    submissionId: row.submissionId || null,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
      version: 1,
    },
    statusTransitions: {
      published: Timestamp.now(),
      accepted: null,
      cancelled: null,
      finalized: null,
    },
  };
}
