import { Firestore, GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { error, info } from 'firebase-functions/logger';
import { StorageEvent } from 'firebase-functions/v2/storage';
import fs from 'fs';
import { geohashForLocation } from 'geofire-common';
import { round } from 'lodash-es';
import { tmpdir } from 'os';
import path from 'path';

import {
  Address,
  COLLECTIONS,
  CancellationReason,
  ILocation,
  LocationParent,
  MailingAddress,
  POLICY_STATUS,
  PaymentStatus,
  PolicyNew,
  Product,
  RatingData,
  StagedPolicyImport,
  ValueByRiskType,
  audience,
  getReportErrorFn,
  hostingBaseURL,
  importSummaryCollection,
  licensesCollection,
  locationsCollection,
  policiesCollection,
  printObj,
  ratingDataCollection,
  sendgridApiKey,
  stagedImportsCollection,
  throwIfExists,
} from '../common/index.js';
import { createDocId } from '../modules/db/index.js';
import { calcPolicyPremiumAndTaxes, getCarrierByState, getRCVs } from '../modules/rating/index.js';
import {
  ParseStreamToArrayRes,
  eventOlderThan,
  parseStreamToArray,
  shouldReturnEarly,
  transformHeadersCamelCase,
} from '../modules/storage/index.js';
import { calcTerm, getTermDays } from '../modules/transactions/index.js';
import { sendAdminPolicyImportNotification } from '../services/sendgrid/index.js';
import { locationToPolicyLocation, randomFileName, unlinkFile, verify } from '../utils/index.js';
import { CSVPolicyRow, ParsedPolicyRow } from './models/index.js';
import { transformPolicyRow } from './transform/index.js';
import { validatePolicyRow } from './validation/index.js';

// TODO:
//  - add rating fields (used for ratios)
//  - cancel date (and filter out cancelled dates from any policy totals)
//  - refactor policy created firestore listener (trigger policy.created explicitly)
//  - transactions import from CSV
//  - move transform, validation, types/model, etc. to separate file

const IMPORT_POLICIES_FOLDER = 'importPolicies';

// store surplus lines producer of record info in global scope so it doesn't need to be refetched
let surplusLinesLicenseByState: Record<string, any> = {};

const reportErr = getReportErrorFn('importPolicies');

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name;
  const fileName = path.basename(filePath || '');

  if (shouldReturnEarly(event, IMPORT_POLICIES_FOLDER, 'text/csv', 'processed')) return;
  // idempotency - Ignore events that are too old (1 min)
  if (eventOlderThan(event)) return;

  const db = getFirestore();
  const policiesColRef = policiesCollection(db);
  const locationsColRef = locationsCollection(db);
  const ratingColRef = ratingDataCollection(db);
  const importSummaryRef = importSummaryCollection(db).doc(event.id);
  const importStagingCol = stagedImportsCollection(db, importSummaryRef.id);

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = path.join(tmpdir(), randomFileName(filePath));

  await bucket.file(filePath).download({ destination: tempFilePath });
  info(`File downloaded locally to ${tempFilePath}`);

  let dataArr: ParseStreamToArrayRes<ParsedPolicyRow>['dataArr'] = [];
  let invalidRows: ParseStreamToArrayRes<ParsedPolicyRow>['invalidRows'] = [];

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
    if (parsed.invalidRows.length) {
      console.log('INVALID ROW 1');
      printObj(parsed.invalidRows[1]);
    }
    if (!dataArr.length) throw new Error('No valid rows');

    await unlinkFile(tempFilePath);
  } catch (err: any) {
    reportErr(`ERROR PARSING CSV. RETURNING EARLY`, {}, err);

    await unlinkFile(tempFilePath);
    // TODO: report error to sentry or send email to admin
    return;
  }

  let policyRecords: Record<string, PolicyNew>;
  let locationRecords: Record<string, ILocation>;
  let ratingRecords: Record<string, RatingData>;
  let lcnIdMap: Record<string, string>;

  try {
    info('Grouping locations by policy...');
    const {
      formattedPolicies,
      locations,
      ratingDocData,
      lcnIdMap: idMap,
    } = await groupByPolicyId(dataArr, db);

    policyRecords = formattedPolicies;
    locationRecords = locations;
    ratingRecords = ratingDocData;
    lcnIdMap = idMap;

    if (!policyRecords) throw new Error('Error formatting rows into policies');
  } catch (err: any) {
    // TODO: report error to admin (email?)
    reportErr('Errror grouping & formatting locations into policies', {}, err);
    return;
  }

  const ratingEntries = Object.entries(ratingRecords);

  let importedIds: string[] = [];
  let createErrors: any[] = [];

  // Loop through policies --> create new record for each
  for (const [policyId, policyData] of Object.entries(policyRecords)) {
    try {
      info(`creating staged policy ${policyId}...`, { ...policyData });

      const policyRef = policiesColRef.doc(policyId);
      await throwIfExists(policyRef);

      const batch = db.batch();

      const locationKeys = Object.keys(policyData.locations);
      for (const key of locationKeys) {
        const locationRecord = locationRecords[key];
        verify(locationRecord, `location record not found with ID ${key}`);

        const locationRef = locationsColRef.doc(key);
        await throwIfExists(locationRef);
        batch.set(locationRef, locationRecord);

        const ratingEntMatch = ratingEntries.find((ratingEnt) => ratingEnt[1].locationId === key);
        verify(ratingEntMatch, `Could not find incoming rating doc with location ID ${key}`);

        const ratingDocRef = ratingColRef.doc(ratingEntMatch[0]);
        batch.set(ratingDocRef, ratingEntMatch[1]);
      }

      const data: StagedPolicyImport = {
        ...policyData,
        lcnIdMap,
        importMeta: {
          status: 'new',
          eventId: event.id,
          targetCollection: COLLECTIONS.POLICIES,
        },
      };

      const policyImportRef = importStagingCol.doc(policyId);
      batch.set(policyImportRef, data);

      importedIds.push(policyId);

      await batch.commit();
    } catch (err: any) {
      console.log('ERR: ', err);
      error(`Error creating policy record in DB ${policyId}`, { err });
      createErrors.push(policyData);
    }
  }

  // Save import summary & send admin notification
  try {
    await importSummaryRef.set({
      targetCollection: COLLECTIONS.POLICIES,
      importDocIds: importedIds,
      docCreationErrors: createErrors,
      invalidRows,
      metadata: {
        created: Timestamp.now(),
      },
    });
    info(`SAVED IMPORT SUMMARY TO DOC ${importSummaryRef.id}`);

    const sgKey = sendgridApiKey.value();
    const to = ['spencer.carlson@idemandinsurance.com'];
    let link;

    if (audience.value() !== 'LOCAL HUMANS') {
      to.push('ron.carlson@idemandinsurance.com');

      link = `${hostingBaseURL.value}/admin/config/imports`;
    }

    await sendAdminPolicyImportNotification(
      sgKey,
      to,
      importedIds.length,
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

// TODO: break into smaller functions

/**
 * Proup each row by policy ID, and set each row as location inside the policy. Policy level data will use the value in the last location row
 * @param {ParsedPolicyRow[]} data all rows from csv
 * @param {Firestore} firestore Firestore DB ref
 * @returns {object} object of policies, locations and ratingData
 */
async function groupByPolicyId(data: ParsedPolicyRow[], firestore: Firestore) {
  // let policies: Record<string, Omit<Policy, 'termPremium'>> = {};
  let policies: Record<string, Omit<PolicyNew, 'termPremium' | 'termPremiumWithCancels'>> = {};
  let locations: Record<string, ILocation> = {};
  let ratingDocData: Record<string, RatingData> = {};
  let lcnIdMap: Record<string, string> = {};
  const ts = Timestamp.now();

  for (const row of data) {
    let locId = createDocId();
    lcnIdMap[locId] = row.externalId;
    info(`Formatting location ${row.externalId}`);
    const formattedLocation = formatPolicyLocation(row, locId, ts, 'policy');

    const ratingDocId = createDocId();
    const AALs = {
      inland: row.AALs.inland,
      surge: row.AALs.surge,
      tsunami: row.AALs.tsunami,
    };
    const techPremium = {
      inland: row.techPremium.inland as number,
      surge: row.techPremium.surge as number,
      tsunami: row.techPremium.tsunami as number,
    };
    const ratingData = getRatingData(
      formattedLocation,
      row.mgaCommissionPct as number,
      AALs,
      techPremium
    );
    ratingDocData[ratingDocId] = ratingData;

    const locationWithRatingId = { ...formattedLocation, ratingDocId };
    locations[locId] = { ...locationWithRatingId, policyId: row.policyId as string };

    const fees = row.fees;
    const taxes = row.taxes;

    const policyId = row.policyId as string;
    const existingPolicy = policies[policyId] || null;

    const policyLocation = locationToPolicyLocation(formattedLocation);

    if (existingPolicy) {
      info(`adding location to policy ${row.externalId}`);
      const updatedPolicy = {
        ...existingPolicy,
        fees,
        taxes,
        locations: { ...existingPolicy.locations, [locId]: policyLocation },
      };

      policies[policyId] = updatedPolicy;
    } else {
      info(`creating policy and adding location ${row.externalId}`);
      const policyWithoutLocation = await getPolicyWithoutLocation(row, ts, firestore);

      policies[policyId] = {
        ...policyWithoutLocation,
        fees,
        taxes,
        locations: {
          [locId]: policyLocation,
        },
      };
    }
  }

  // Calc policy level term premium
  const formattedPolicies: Record<string, PolicyNew> = {};
  for (const [policyId, policy] of Object.entries(policies)) {
    // recalc premium, taxes, price
    const policyPremRecalc = calcPolicyPremiumAndTaxes(
      Object.values(policy.locations),
      policy.homeState,
      policy.taxes,
      policy.fees
    );

    formattedPolicies[policyId] = {
      ...policy,
      ...policyPremRecalc,
    };
  }

  return { formattedPolicies, locations, ratingDocData, lcnIdMap };
}

function formatPolicyLocation(
  data: ParsedPolicyRow,
  locationId: string,
  ts: Timestamp,
  parentType?: LocationParent
): ILocation {
  const geoHash = geohashForLocation([data.coordinates!.latitude, data.coordinates!.longitude]);

  const effDate = data.effectiveDate || (data.policyEffectiveDate as Date);
  const expDate = data.expirationDate || (data.policyExpirationDate as Date);

  const effDateTs = Timestamp.fromDate(effDate);
  const expDateTs = Timestamp.fromDate(expDate);
  const cancelEffDate = data.cancelEffDate ? Timestamp.fromDate(data.cancelEffDate) : null;

  const { termDays, termPremium } = calcTerm(data.annualPremium, effDate, expDate);

  const location: ILocation = {
    parentType: parentType || null,
    address: data.address as Address,
    coordinates: data.coordinates as GeoPoint,
    geoHash,
    annualPremium: data.annualPremium,
    termPremium,
    termDays,
    limits: data.limits,
    TIV: data.TIV,
    RCVs: data.RCVs,
    deductible: data.deductible,
    effectiveDate: effDateTs,
    expirationDate: expDateTs,
    cancelEffDate,
    cancelReason: (data.cancelReason as CancellationReason) || null,
    // exists: true,
    additionalInsureds: data.additionalInsureds || [],
    mortgageeInterest: data.mortgageeInterest || [],
    ratingDocId: data.ratingDocId || '',
    ratingPropertyData: data.ratingPropertyData,
    policyId: data.policyId || '',
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
    // TODO: throw if not found ??

    surplusLinesLicenseByState[data.homeState as string] = SLPofR;
  }

  const effDateTs = Timestamp.fromDate(data.policyEffectiveDate as Date);
  const expDateTs = Timestamp.fromDate(data.policyExpirationDate as Date);

  const termDays = getTermDays(effDateTs.toDate(), expDateTs.toDate());
  // TODO: need to accomidate taxes and fee imports.
  // See importQuotes for reference

  const p: Omit<PolicyNew, 'locations' | 'termPremium' | 'termPremiumWithCancels'> = {
    product: data.product as Product,
    status: POLICY_STATUS.PAID, // TODO: get status from csv
    paymentStatus: PaymentStatus.enum.paid,
    term: data.term as number,
    mailingAddress: data.address as MailingAddress,
    namedInsured: data.namedInsured,
    homeState: data.homeState as string,
    // termPremium: policyTermPremium,
    termDays,
    fees: data.fees,
    taxes: data.taxes,
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

// TODO: move to modules/db
async function getSPLPofR(firestore: Firestore, state: string) {
  const colRef = licensesCollection(firestore);
  const q = colRef.where('state', '==', state).where('surplusLinesProducerOfRecord', '==', true);

  const snap = await q.get();

  if (snap.empty) throw new Error(`No surplus lines license for ${state}`);

  // if (!snap.empty) {
  const data = snap.docs[0].data();
  return {
    name: data.licensee || '',
    licenseNum: data.licenseNumber || '',
    licenseState: state || '',
    phone: data.phone || '',
  };
  // }

  // return {
  //   name: '',
  //   licenseNum: '',
  //   licenseState: '',
  //   phone: '',
  // };
}

// TODO: need tech premium
function getRatingData(
  data: ILocation,
  mgaCommissionPct: number,
  AALs: any,
  techPremium: ValueByRiskType
): RatingData {
  return {
    submissionId: null,
    locationId: data.locationId,
    externalId: data.externalId || null,
    limits: data.limits,
    TIV: data.TIV,
    deductible: data.deductible,
    RCVs: getRCVs(data.ratingPropertyData?.replacementCost, data.limits),
    AALs: {
      inland: AALs.inland,
      surge: AALs.surge,
      tsunami: AALs.tsunami,
    },
    // PM: {
    //   inland: 0,
    //   surge: 0,
    //   tsunami: 0,
    // },
    // riskScore: {
    //   inland: 0,
    //   surge: 0,
    //   tsunami: 0,
    // },
    // stateMultipliers: {
    //   inland: 0,
    //   surge: 0,
    //   tsunami: 0,
    // },
    // secondaryFactorMults: {
    //   inland: 0,
    //   surge: 0,
    //   tsunami: 0,
    //   secondaryFactorMultsByFactor: {
    //     ffeMult: {
    //       inland: 0,
    //       surge: 0,
    //       tsunami: 0,
    //     },
    //     basementMult: 0,
    //     historyMult: {
    //       inland: null,
    //       surge: null,
    //       tsunami: null,
    //     },
    //     contentsMult: 0,
    //     ordinanceMult: 0,
    //     distanceToCoastMult: 0,
    //     tier1Mult: 0,
    //   },
    // },
    address: data.address,
    coordinates: data.coordinates,
    ratingPropertyData: data.ratingPropertyData,
    premiumCalcData: {
      techPremium: {
        inland: techPremium?.inland,
        surge: techPremium?.inland,
        tsunami: techPremium?.inland,
      },
      // floodCategoryPremium: {
      //   inland: 0,
      //   surge: 0,
      //   tsunami: 0,
      // },
      // premiumSubtotal: 0,
      // provisionalPremium: 0,
      // subproducerAdj: 0,
      // subproducerCommissionPct: 0,
      // minPremium: 0,
      // minPremiumAdj: 0,
      annualPremium: data.annualPremium,
      MGACommission: round(data.termPremium * mgaCommissionPct, 2),
      MGACommissionPct: mgaCommissionPct,
    },
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
}
