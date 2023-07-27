import { StorageEvent } from 'firebase-functions/v2/storage';
import { error, info } from 'firebase-functions/logger';
import { GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { geohashForLocation } from 'geofire-common';
import { projectID } from 'firebase-functions/params';
import fs from 'fs';
import os from 'os';
import path from 'path';
import invariant from 'tiny-invariant';
import { add, isDate, startOfDay } from 'date-fns';

import {
  ParseStreamToArrayRes,
  parseStreamToArray,
  transformHeadersCamelCase,
} from '../utils/parseStreamToArray';
import { eventOlderThan, fetchTaxes, shouldReturnEarly } from '../utils';
import {
  COLLECTIONS,
  DeepNullable,
  Nullable,
  Product,
  QUOTE_STATUS,
  Quote,
  RatingPropertyData,
  audience,
  extractNumber,
  extractNumberNeg,
  getCardFee,
  isValidEmail,
  maxBCD,
  minDeductibleFlood,
  quotesCollection,
  sendgridApiKey,
  sumfeesTaxesPremium,
  truthyOrZero,
  unlinkFile,
} from '../common';
import { sendAdminPolicyImportNotification } from '../services/sendgrid';
import { getFormattedFees } from './importPolicies';

// import { sendAdminPolicyImportNotification } from '../services/sendgrid';

const QUOTE_IMPORT_FOLDER = 'importQuotes';

export interface CSVQuoteRow {
  // extends Record<string, string>
  product: string;
  deductible: string;
  limitA: string;
  limitB: string;
  limitC: string;
  limitD: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postal: string;
  latitude: string;
  longitude: string;
  countyName?: string;
  fips?: string;
  homeState: string;
  annualPremium: string;
  subproducerCommission: string;
  quoteTotal: string;
  effectiveDate?: string;
  quoteExpirationDate?: string;
  quotePublishDate?: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  mailingAddressName: string;
  mailingAddressLine1: string;
  mailingAddressLine2: string;
  mailingCity: string;
  mailingState: string;
  mailingPostal: string;
  agentName: string;
  agentEmail: string;
  agentPhone: string;
  agentId: string;
  agencyName: string;
  orgId: string;
  agencyAddressLine1: string;
  agencyAddressLine2: string;
  agencyCity: string;
  agencyState: string;
  agencyPostal: string;
  cbrsDesignation: string;
  basement: string;
  distToCoastFeet: string;
  floodZone: string;
  numStories: string;
  propertyCode: string;
  replacementCost: string;
  sqFootage: string;
  yearBuilt: string;
  ffh: string;
  priorLossCount: string;
  ratingDocId?: string;
  locationId?: string;
  submissionId?: string;
  fee1Name?: string;
  fee1Value?: string;
  fee2Name?: string;
  fee2Value?: string;
}

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name; // File path in the bucket.
  const fileName = path.basename(filePath || '');

  if (shouldReturnEarly(event, QUOTE_IMPORT_FOLDER, 'text/csv', 'processed')) return;

  if (eventOlderThan(event)) return; // return if event older than 1 min

  const db = getFirestore();
  const quoteColRef = quotesCollection(db);

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), `temp_portfolio_import_${fileName}`);

  await bucket.file(filePath).download({ destination: tempFilePath });
  info(`File downloaded locally to ${tempFilePath}`);

  let dataArr: ParseStreamToArrayRes<Quote>['dataArr'] = [];
  let invalidRows: ParseStreamToArrayRes<Quote>['invalidRows'] = [];

  const stream = fs.createReadStream(tempFilePath);

  try {
    const parsed = await parseStreamToArray<CSVQuoteRow, Quote>(
      stream,
      { headers: transformHeadersCamelCase },
      transformQuoteRow,
      validateQuoteRow
    );

    dataArr = [...parsed.dataArr];
    invalidRows = [...parsed.invalidRows];

    info(`${parsed.dataArr.length} valid rows and ${parsed.invalidRows.length} invalid rows`, {
      invalidRows,
      dataArr,
    });
    if (!dataArr.length) throw new Error('No valid rows');
  } catch (err: any) {
    error(`ERROR PARSING CSV. RETURNING EARLY`, { err });

    await unlinkFile(tempFilePath);
    // TODO: report error to sentry or send email to admin
    return;
  }

  const quoteIds = [];
  const importErrors = [];

  for (const q of dataArr) {
    try {
      let taxes = await fetchTaxes(q, 'new');

      const quoteTotal = sumfeesTaxesPremium(q.fees, taxes, q.annualPremium);

      const cardFee = getCardFee(quoteTotal);

      const quote: Quote = {
        ...q,
        taxes,
        quoteTotal,
        cardFee,
      };
      info(`Saving new quote`, quote);

      const quoteRef = await quoteColRef.add(quote);

      quoteIds.push(quoteRef.id);
    } catch (err: any) {
      error('Error saving quote', { err });
      importErrors.push(q);
    }
  }
  info(`Imported ${quoteIds.length} quotes with ${importErrors.length} failures`, {
    quoteIds,
    importErrors,
  });

  try {
    const importSummaryColRef = db.collection(COLLECTIONS.DATA_IMPORTS);
    const summaryRef = await importSummaryColRef.add({
      importCollection: COLLECTIONS.POLICIES,
      importDocIds: quoteIds,
      docCreationErrors: importErrors,
      invalidRows,
      metadata: {
        created: Timestamp.now(),
      },
    });
    info(`SAVED IMPORT SUMMARY TO DOC ${summaryRef.id}`);

    const to = ['spencer.carlson@idemandinsurance.com'];
    let link;

    if (audience.value() !== 'LOCAL HUMANS') {
      to.push('ron.carlson@idemandinsurance.com');

      link = `https://console.firebase.google.com/project/${projectID.value()}/firestore/data/~2F${
        COLLECTIONS.DATA_IMPORTS
      }~2F${summaryRef.id}`;
    }

    sendAdminPolicyImportNotification(
      sendgridApiKey.value(),
      to,
      quoteIds.length,
      importErrors.length,
      invalidRows.length,
      fileName,
      link,
      undefined,
      {
        customArgs: {
          firebaseEventId: event.id,
          emailType: 'quote_import',
        },
      }
    );
  } catch (err: any) {
    error('Error saving import summary doc or delivering email notification', { err });
  }

  return;
};

/**
 * Transform csv row to Quote shape
 * @param {CSVQuoteRow} row csv row after headers converted (if header transform provided)
 * @returns {DeepNullable<Quote>} values shaped as quote, null if not provided
 */
function transformQuoteRow(row: CSVQuoteRow): DeepNullable<Quote> {
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

  // const fees: Quote['fees'] = [];
  // const fee1: FeeItem = {
  //   feeName: row.fee1Name || '',
  //   feeValue: row.fee1Value ? extractNumber(row.fee1Value) : 0,
  // };
  // const fee2: FeeItem = {
  //   feeName: row.fee2Name || '',
  //   feeValue: row.fee2Value ? extractNumber(row.fee2Value) : 0,
  // };
  // if (fee1.feeValue) fees.push(fee1);
  // if (fee2.feeValue) fees.push(fee2);

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

// TODO: reusable quote validator ??
/**
 * Validate formatted Quote, after transform function
 * @param {DeepNullable<Quote>} row formatted row
 * @returns {boolean} returns false if validation fails, otherwise true
 */
function validateQuoteRow(row: DeepNullable<Quote>): boolean {
  try {
    invariant(
      row.limits?.limitA && typeof row.limits?.limitA === 'number',
      'limitA must be a number'
    );
    invariant(
      truthyOrZero(row.limits?.limitB) && typeof row.limits?.limitB === 'number',
      'limitB must be a number'
    );
    invariant(
      truthyOrZero(row.limits?.limitC) && typeof row.limits?.limitC === 'number',
      'limitC must be a number'
    );
    invariant(
      truthyOrZero(row.limits?.limitD) && typeof row.limits?.limitD === 'number',
      'limitD must be a number'
    );

    const sumBCD = row.limits?.limitB + row.limits?.limitC + row.limits?.limitD;
    invariant(
      sumBCD < maxBCD.value(),
      `sum limits B, C, D must be < ${maxBCD.value()} (total: ${sumBCD})`
    );

    invariant(typeof row.deductible === 'number', 'Deductible must be a number');
    invariant(
      row.deductible >= minDeductibleFlood.value(),
      `Deductible must be > ${minDeductibleFlood.value()}`
    );

    invariant(row.address?.addressLine1, 'addressLine1 required');
    invariant(row.address?.city, 'city required');
    invariant(row.address?.state, 'state required');
    invariant(row.address?.postal, 'postal required');

    invariant(row.coordinates, 'latitude & longitude required');

    invariant(row.homeState, 'homeState required');

    invariant(typeof row.annualPremium === 'number', 'annualPremium must be a number');
    invariant(row.annualPremium >= 100, 'annualPremium must be > 100');

    // quoteTotal calced after taxes fetched
    // invariant(typeof row.quoteTotal === 'number', 'quoteTotal must be a number');
    // invariant(row.quoteTotal >= 100, 'quoteTotal must be > 100');
    const comm = row.subproducerCommission;
    invariant(comm && typeof comm === 'number', 'subproducerCommission must be a number');
    invariant(comm > 0.05 && comm < 0.2, 'subproducerCommission must be between 0.05 and 0.2');

    // namedInsured email ??
    //  invariant(data.namedInsured?.displayName, 'named insured displayName required');
    //  invariant(data.namedInsured?.email, 'named insured email required');
    //  invariant(data.namedInsured?.phone, 'named insured phone required');

    //  invariant(data.agent?.name, 'agentName required');
    //  invariant(data.agent?.email, 'agentEmail required');

    //  invariant(data.agency?.name, 'agencyName required');
    //  invariant(data.agency?.orgId, 'agencyId required');
    //  invariant(data.agency?.address?.addressLine1, 'agencyAddressLine1 required');
    //  invariant(data.agency?.address?.city, 'agencyCity required');
    //  invariant(data.agency?.address?.state, 'agencyState required');
    //  invariant(data.agency?.address?.postal, 'agencyPostal required');

    invariant(row.agent?.name, 'missing agentName');
    invariant(row.agent?.email && isValidEmail(row.agent?.email), 'invalid agent email');
    invariant(row.agent?.phone, 'missing agent phone');
    invariant(row.agent?.userId, 'missing agentId');

    invariant(row.agency?.name, 'missing agencyName');
    invariant(row.agency?.address?.addressLine1, 'missing agency addressLine1');
    invariant(row.agency?.address?.city, 'missing agency city');
    invariant(row.agency?.address?.state, 'missing agency state');
    invariant(row.agency?.address?.postal, 'missing agency postal');
    invariant(row.agency?.orgId, 'missing agency orgId');

    invariant(
      // @ts-ignore
      row.quoteExpirationDate && isDate(row.quoteExpirationDate?.toDate()),
      'policyEffectiveDate required'
    );
    invariant(
      // @ts-ignore
      row.quotePublishedDate && isDate(row.quotePublishedDate?.toDate()),
      'policyExpirationDate required'
    );
    invariant(row.status, 'missing status');
    invariant(row?.ratingPropertyData?.priorLossCount, 'missing priorLossCount');
    invariant(row.product, 'missing product');

    invariant(Array.isArray(row.fees), 'fees must be an array');

    return true;
  } catch (err: any) {
    return false;
  }
}
