import { StorageEvent } from 'firebase-functions/v2/storage';
import { error, info, warn } from 'firebase-functions/logger';
import { projectID } from 'firebase-functions/params';
import { Firestore, GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { geohashForLocation } from 'geofire-common';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { v4 as uuid } from 'uuid';
import invariant from 'tiny-invariant';
import { isDate } from 'date-fns';

import { parseStreamToArray, transformHeadersCamelCase } from '../utils/parseStreamToArray';
import {
  AdditionalInsured,
  Address,
  AgencyDetails,
  AgentDetails,
  COLLECTIONS,
  Limits,
  Mortgagee,
  NamedInsured,
  Nullable,
  POLICY_STATUS,
  PRODUCT,
  Policy,
  PolicyLocation,
  Product,
  RCVs,
  RatingPropertyData,
  SLProdOfRecordDetails,
  audience,
  extractNumber,
  extractNumberNeg,
  licensesCollection,
  maxA,
  maxBCD,
  minA,
  minDeductibleFlood,
  policiesCollection,
  sendgridApiKey,
  throwIfExists,
  truthyOrZero,
  unlinkFile,
} from '../common';
import { sendAdminPolicyImportNotification } from '../services/sendgrid';
import { getRCVs } from '../utils/rating';
import { getCarrierByState } from '../callables/createPolicy';

const IMPORT_POLICIES_FOLDER = 'importPolicies';

// store surplus lines producer of record info so it doesn't need to be refetched
let surplusLinesLicenseByState: Record<string, any> = {};

// TODO: type input row
type CSVPolicyCamelCaseHeaders =
  | 'policyId'
  | 'locationId'
  | 'addressLine1'
  | 'addressLine2'
  | 'city'
  | 'state'
  | 'postal'
  | 'countyName'
  | 'fips'
  | 'latitude'
  | 'longitude'
  | 'homeState'
  | 'deductible'
  | 'limitA'
  | 'limitB'
  | 'limitC'
  | 'limitD'
  | 'annualPremium'
  | 'policyPrice'
  | 'locationEffectiveDate'
  | 'locationExpirationDate'
  | 'policyEffectiveDate'
  | 'policyExpirationDate'
  | 'term'
  | 'displayName'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'userId'
  | 'orgId'
  | 'agentName'
  | 'agentEmail'
  | 'agentPhone'
  | 'agentId'
  | 'agencyName'
  | 'agencyId'
  | 'agencyAddressLine1'
  | 'agencyAddressLine2'
  | 'agencyCity'
  | 'agencyState'
  | 'agencyPostal'
  | 'cbrsDesignation'
  | 'basement'
  | 'distToCoastFeet'
  | 'floodZone'
  | 'numStories'
  | 'propertyCode'
  | 'replacementCost'
  | 'sqFootage'
  | 'yearBuilt'
  | 'ffh'
  | 'product';

type CSVPolicyRow = Record<CSVPolicyCamelCaseHeaders, string>;

interface ParsedPolicyRow {
  policyId: string | null;
  limits: Limits;
  TIV: number;
  deductible: number;
  address: Nullable<Address>;
  coordinates: GeoPoint | null;
  homeState: string | null;
  RCVs: RCVs;
  annualPremium: number;
  price: number | null;
  namedInsured: NamedInsured;
  userId: string | null;
  agent: AgentDetails;
  agency: AgencyDetails;
  surplusLinesProducerOfRecord?: SLProdOfRecordDetails;
  issuingCarrier?: string | null;
  quoteId?: string | null;
  effectiveDate: Date | null;
  expirationDate: Date | null;
  policyEffectiveDate: Date | null;
  policyExpirationDate: Date | null;
  externalId: string;
  additionalInsured: AdditionalInsured[];
  mortgageeInterest: Mortgagee[];
  term: number | null;
  ratingPropertyData: RatingPropertyData;
  ratingDocId?: string;
  product: string;
}

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name; // File path in the bucket.
  const fileName = path.basename(filePath || '');
  const contentType = event.data.contentType;
  const metageneration = event.data.metageneration as unknown;

  if (!event.data.name?.startsWith(`${IMPORT_POLICIES_FOLDER}/`)) {
    info(
      `Ignoring upload "${event.data.name}" because is not in the "/${IMPORT_POLICIES_FOLDER}/*" folder.`
    );
    return null;
  }

  // return early if file is not new (metadata change) or not csv
  if (metageneration !== '1' || contentType !== 'text/csv' || !filePath) {
    console.log(
      `validation failed. contentType: ${contentType}. metageneration: ${metageneration}. filepath: ${filePath}`
    );
    return null;
  }

  // idempotency / loop guard - Ignore events that are too old
  const eventAge = Date.now() - Date.parse(event.time);
  const eventMaxAge = 1000 * 60 * 1; // 1 min

  if (eventAge > eventMaxAge) {
    info(`Dropping event ${event.id} with age ${eventAge} ms.`, { ...event });
    return;
  }

  const db = getFirestore();
  const policiesCollRef = policiesCollection(db);

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), `temp_portfolio_import_${fileName}`);

  await bucket.file(filePath).download({ destination: tempFilePath });
  info(`File downloaded locally to ${tempFilePath}`);

  let dataArr: any[] = [];
  let invalidRows: { rowNum: any; rowData: any }[] = [];

  const stream = fs.createReadStream(tempFilePath);

  try {
    const parsed = await parseStreamToArray<CSVPolicyRow, ParsedPolicyRow>(
      stream,
      { headers: transformHeadersCamelCase },
      transformPolicyRow,
      validatePolicyRow
    );

    dataArr = [...parsed.dataArr];
    invalidRows = [...parsed.invalidRows];

    info(`${parsed.dataArr.length} valid rows and ${parsed.invalidRows.length} invalid rows`);
    if (!dataArr.length) throw new Error('No valid rows');

    fs.unlinkSync(tempFilePath);
  } catch (err: any) {
    error(`ERROR PARSING CSV. RETURNING EARLY`, { err });

    await unlinkFile(tempFilePath);
    // TODO: report error to sentry or send email to admin
    return;
  }

  let formattedPolicies: any;
  try {
    formattedPolicies = await groupByPolicyId(dataArr, db);

    if (!formattedPolicies) throw new Error('Error formatting rows into policies');
  } catch (err: any) {
    // TODO: report error to admin
    error('Errror grouping & formatting locations into policies', { err });
    return;
  }

  // upload using provided policy ID ?? use set & update locations arr ??
  // const policies = Object.values(formattedPolicies);
  // TODO: batch transaction

  let createErrors: any[] = [];

  for (const policyId in formattedPolicies) {
    const policyData = formattedPolicies[policyId];
    try {
      info(`creating policy ${policyId}...`, { ...policyData });

      const policyRef = policiesCollRef.doc(policyId);
      await throwIfExists(policyRef);

      await policyRef.set({ ...policyData });
    } catch (err: any) {
      error(`Error created policy record in DB ${policyId}`, { err });
      createErrors.push(policyData);
    }
  }

  try {
    const importSummaryColRef = db.collection(COLLECTIONS.DATA_IMPORTS);
    const summaryRef = await importSummaryColRef.add({
      importCollection: COLLECTIONS.POLICIES,
      importDocIds: Object.keys(formattedPolicies),
      docCreationErrors: createErrors,
      invalidRows,
      metadata: {
        created: Timestamp.now(),
      },
    });
    info(`SAVED IMPORT SUMMARY TO DOC ${summaryRef.id}`);

    const sgKey = sendgridApiKey.value();
    const to = ['spencer.carlson@idemandinsurance.com'];
    let link;

    if (audience.value() !== 'LOCAL HUMANS') {
      to.push('ron.carlson@idemandinsurance.com');

      link = `https://console.firebase.google.com/project/${projectID}/firestore/data/~2F${COLLECTIONS.DATA_IMPORTS}~2F${summaryRef.id}`;
    }

    await sendAdminPolicyImportNotification(
      sgKey,
      to,
      Object.keys(formattedPolicies).length,
      createErrors.length,
      invalidRows.length,
      fileName,
      link,
      undefined,
      {
        customArgs: {
          firebaseEventId: event.id,
          emailType: 'policy_import',
        },
      }
    );
  } catch (err: any) {
    error('Error saving summary or notifying admin', { err });
  }

  return;
};

// (row: CSVPolicyRow):  ParsedPolicyRow {
// function transformPolicyRow(row: ParserSyncRowTransform<CSVPolicyRow, ParsedPolicyRow>) {

/** Converts to correct type and unflattens
 * @param {CSVPolicyRow} row raw input from csv
 * @returns {ParsedPolicyRow} formatted types, depth, etc.
 */
function transformPolicyRow(row: CSVPolicyRow): ParsedPolicyRow {
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

  const transformed: ParsedPolicyRow = {
    policyId: row.policyId || null,
    address: {
      addressLine1: row.addressLine1 || null,
      addressLine2: row.addressLine2 || null,
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
    annualPremium: row.annualPremium ? extractNumber(row.annualPremium) : 0,
    price,
    effectiveDate: row.locationEffectiveDate ? new Date(row.locationEffectiveDate) : null,
    expirationDate: row.locationExpirationDate ? new Date(row.locationExpirationDate) : null,
    policyEffectiveDate: row.policyEffectiveDate ? new Date(row.policyEffectiveDate) : null,
    policyExpirationDate: row.policyExpirationDate ? new Date(row.policyExpirationDate) : null,
    externalId: row.locationId,
    additionalInsured: [],
    mortgageeInterest: [],
    term: row.term ? extractNumber(row.term) : 1,
    namedInsured,
    userId: row.userId || null,
    agent,
    agency,
    ratingPropertyData,
    product: row.product || 'flood',
  };
  return transformed;
}

/** Validates row values - will skip row if any validation fails
 * @param {ParsedPolicyRow} data formatted row
 * @returns {boolean} returns false if validation fails, otherwise true
 */
function validatePolicyRow(data: ParsedPolicyRow) {
  try {
    invariant(
      truthyOrZero(data.limits?.limitA) && typeof data.limits?.limitA === 'number',
      'limit A must be a number'
    );
    invariant(
      truthyOrZero(data.limits?.limitB) && typeof data.limits?.limitB === 'number',
      'limit B must be a number'
    );
    invariant(
      truthyOrZero(data.limits?.limitC) && typeof data.limits?.limitC === 'number',
      'limit C must be a number'
    );
    invariant(
      truthyOrZero(data.limits?.limitD) && typeof data.limits?.limitD === 'number',
      'limit D must be a number'
    );

    invariant(
      data.limits?.limitA > minA.value(),
      `LimitA must be > ${minA.value()} (val: ${data.limits?.limitA})`
    );
    invariant(
      data.limits?.limitA < maxA.value(),
      `LimitA must be < ${maxA.value()} (val: ${data.limits?.limitA})`
    );

    const sumBCD = data.limits?.limitB + data.limits?.limitC + data.limits?.limitD;
    invariant(
      sumBCD < maxBCD.value(),
      `sum limits B, C, D must be < ${maxBCD.value()} (total: ${sumBCD})`
    );

    invariant(typeof data.TIV === 'number', 'Error calcualting TIV (not a number)');

    invariant(typeof data.deductible === 'number', 'Deductible must be a number');
    invariant(
      data.deductible >= minDeductibleFlood.value(),
      `Deductible must be > ${minDeductibleFlood.value()}`
    );

    invariant(data.address?.addressLine1, 'addressLine1 required');
    invariant(data.address?.city, 'city required');
    invariant(data.address?.state, 'state required');
    invariant(data.address?.postal, 'postal required');

    invariant(data.coordinates, 'latitude & longitude required');

    invariant(data.homeState, 'homeState required');

    invariant(
      truthyOrZero(data.RCVs?.building) && typeof data.RCVs?.building === 'number',
      'building RCV required'
    );
    invariant(
      truthyOrZero(data.RCVs?.otherStructures) && typeof data.RCVs?.otherStructures === 'number',
      'error calculating structures RCV'
    );
    invariant(
      truthyOrZero(data.RCVs?.contents) && typeof data.RCVs?.contents === 'number',
      'error calculating contents RCV'
    );
    invariant(
      truthyOrZero(data.RCVs?.BI) && typeof data.RCVs?.BI === 'number',
      'error calculating BI RCV'
    );
    invariant(
      truthyOrZero(data.RCVs?.total) && typeof data.RCVs?.total === 'number',
      'rcv total must be a number'
    );

    invariant(typeof data.annualPremium === 'number', 'annualPremium must be a number');
    invariant(data.annualPremium >= 100, 'annualPremium must be > 100');

    invariant(data.namedInsured?.displayName, 'named insured displayName required');
    invariant(data.namedInsured?.email, 'named insured email required');
    invariant(data.namedInsured?.phone, 'named insured phone required');

    invariant(data.agent?.name, 'agentName required');
    invariant(data.agent?.email, 'agentEmail required');

    invariant(data.agency?.name, 'agencyName required');
    invariant(data.agency?.orgId, 'agencyId required');
    invariant(data.agency?.address?.addressLine1, 'agencyAddressLine1 required');
    invariant(data.agency?.address?.city, 'agencyCity required');
    invariant(data.agency?.address?.state, 'agencyState required');
    invariant(data.agency?.address?.postal, 'agencyPostal required');

    invariant(
      data.policyEffectiveDate && isDate(data.policyEffectiveDate),
      'policyEffectiveDate required'
    );
    invariant(
      data.policyExpirationDate && isDate(data.policyExpirationDate),
      'policyExpirationDate required'
    );

    const locationEffAfterPolicyEff = data.effectiveDate
      ? data.policyEffectiveDate <= data.effectiveDate
      : true;

    invariant(
      locationEffAfterPolicyEff,
      'location effective date must be equal to or after policy effective date'
    );

    const locationExpAfterPolicyExp = data.expirationDate
      ? data.policyExpirationDate >= data.expirationDate
      : true;

    invariant(
      locationExpAfterPolicyExp,
      'location expiration date cannot be after policy expiration date'
    );

    invariant(data.policyId, 'policyId required');

    invariant(data.price, 'policyPrice required');

    invariant(data.ratingPropertyData?.distToCoastFeet, 'distToCoastFeet required');
    invariant(data.ratingPropertyData?.basement, 'basement required');
    invariant(data.ratingPropertyData?.floodZone, 'floodZone required');
    invariant(data.ratingPropertyData?.numStories, 'numStories required');
    invariant(data.ratingPropertyData?.replacementCost, 'replacementCost required');
    invariant(data.ratingPropertyData?.sqFootage, 'sqFootage required');

    invariant(
      data.product === PRODUCT.Flood || data.product === PRODUCT.Wind,
      `product must be "${PRODUCT.Flood}" or "${PRODUCT.Wind}"`
    );

    return true;
  } catch (err: any) {
    warn(`ROW VALIDATION FAILED (${err.message})`, { err, row: data });
    return false;
  }
}

async function groupByPolicyId(data: ParsedPolicyRow[], firestore: Firestore) {
  let policies: Record<string, Policy> = {};
  const ts = Timestamp.now();

  for (const row of data) {
    let locId = uuid();
    const formattedLocation = formatPolicyLocation(row, locId, ts);

    const policyId = row.policyId as string;
    const existingPolicy = policies[policyId] || null;

    if (existingPolicy) {
      const updatedPolicy = {
        ...existingPolicy,
        locations: { ...existingPolicy.locations, [locId]: formattedLocation },
      };

      policies[policyId] = updatedPolicy;
    } else {
      const policyWithoutLocation = await getPolicyWithoutLocation(row, ts, firestore);

      policies[policyId] = {
        ...policyWithoutLocation,
        locations: {
          [locId]: formattedLocation,
        },
      };
    }
  }

  return policies;
}

function formatPolicyLocation(
  data: ParsedPolicyRow,
  locationId: string,
  ts: Timestamp
): PolicyLocation {
  const geoHash = geohashForLocation([data.coordinates!.latitude, data.coordinates!.longitude]);

  const effDateTs = Timestamp.fromDate(data.effectiveDate || (data.policyEffectiveDate as Date));
  const expDateTs = Timestamp.fromDate(data.expirationDate || (data.policyExpirationDate as Date));

  const location: PolicyLocation = {
    address: data.address as Address,
    coordinates: data.coordinates as GeoPoint,
    geoHash,
    annualPremium: data.annualPremium,
    limits: data.limits,
    TIV: data.TIV,
    RCVs: data.RCVs,
    deductible: data.deductible,
    effectiveDate: effDateTs,
    expirationDate: expDateTs,
    active: true,
    additionalInsureds: data.additionalInsured || [],
    mortgageeInterest: data.mortgageeInterest || [],
    ratingDocId: data.ratingDocId || '',
    ratingPropertyData: data.ratingPropertyData,
    locationId,
    externalId: data.externalId || null,
    imageURLs: null,
    imagePaths: null,
    metadata: {
      created: ts,
      updated: ts,
    },
  };

  return location;
}

async function getPolicyWithoutLocation(
  data: ParsedPolicyRow,
  ts: Timestamp,
  firestore: Firestore
) {
  let SLPofR = surplusLinesLicenseByState[data.homeState as string] || null;
  if (!SLPofR) {
    SLPofR = await getSPLPofR(firestore, data.homeState as string);

    surplusLinesLicenseByState[data.homeState as string] = SLPofR;
  }

  const effDateTs = Timestamp.fromDate(data.policyEffectiveDate as Date);
  const expDateTs = Timestamp.fromDate(data.policyExpirationDate as Date);

  const p: Omit<Policy, 'locations'> = {
    product: data.product as Product,
    status: POLICY_STATUS.PAID, // TODO: get status from csv
    term: data.term as number,
    mailingAddress: data.address as Address,
    namedInsured: data.namedInsured,
    homeState: data.homeState as string,
    price: data.price as number,
    effectiveDate: effDateTs,
    expirationDate: expDateTs,
    userId: data.userId,
    agent: data.agent,
    agency: data.agency,
    surplusLinesProducerOfRecord: SLPofR,
    issuingCarrier: getCarrierByState(data.homeState as string),
    documents: [],
    metadata: {
      created: ts,
      updated: ts,
    },
  };

  return p;
}

async function getSPLPofR(firestore: Firestore, state: string) {
  const colRef = licensesCollection(firestore);
  const q = colRef.where('state', '==', state).where('surplusLinesProducerOfRecord', '==', true);

  const snap = await q.get();

  if (!snap.empty) {
    const data = snap.docs[0].data();
    return {
      name: data.licensee || '',
      licenseNum: data.licenseNumber || '',
      licenseState: state || '',
      phone: data.phone || '',
    };
  }

  return {
    name: '',
    licenseNum: '',
    licenseState: '',
    phone: '',
  };
}
