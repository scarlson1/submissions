import { Firestore, GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { error, info } from 'firebase-functions/logger';
import { StorageEvent } from 'firebase-functions/v2/storage';
import fs from 'fs';
import { geohashForLocation } from 'geofire-common';
import { round, sumBy } from 'lodash';
import { tmpdir } from 'os';
import path from 'path';
import { v4 as uuid } from 'uuid';

import {
  Address,
  COLLECTIONS,
  MailingAddress,
  POLICY_STATUS,
  Policy,
  PolicyLocation,
  Product,
  RatingData,
  StagedPolicyImport,
  audience,
  calcTerm,
  getNewLocationId,
  getReportErrorFn,
  getTermDays,
  hostingBaseURL,
  importSummaryCollection,
  licensesCollection,
  policiesCollection,
  ratingDataCollection,
  sendgridApiKey,
  stagedImportsCollection,
  throwIfExists,
  unlinkFile,
} from '../common';
import { getCarrierByState, getRCVs, sumFeesTaxesPremium } from '../modules/rating';
import { eventOlderThan, shouldReturnEarly } from '../modules/storage';
import {
  ParseStreamToArrayRes,
  parseStreamToArray,
  transformHeadersCamelCase,
} from '../modules/storage/parseStreamToArray';
import { getInStatePremium, getOutStatePremium, recalcTaxes } from '../modules/transactions';
import { sendAdminPolicyImportNotification } from '../services/sendgrid';
import { validatePolicyRow } from './validation';
import { CSVPolicyRow, ParsedPolicyRow } from './models';
import { transformPolicyRow } from './transform';

// TODO:
//  - add rating fields (used for ratios)
//  - cancel date (and filter out cancelled dates from any policy totals)
//  - refactor policy created firestore listener (trigger policy.created explicitly)
//  - transactions import from CSV
//  - move transform, validation, types/model, etc. to separate file

const IMPORT_POLICIES_FOLDER = 'importPolicies';

// store surplus lines producer of record info in global scope so it doesn't need to be refetched
let surplusLinesLicenseByState: Record<string, any> = {};

// TODO: type input row

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
  const ratingColRef = ratingDataCollection(db);
  const importSummaryRef = importSummaryCollection(db).doc(event.id);
  const importStagingCol = stagedImportsCollection(db, importSummaryRef.id);

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = path.join(tmpdir(), `temp_portfolio_import_${fileName}`);

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
    if (!dataArr.length) throw new Error('No valid rows');

    // fs.unlinkSync(tempFilePath);
    await unlinkFile(tempFilePath);
  } catch (err: any) {
    reportErr(`ERROR PARSING CSV. RETURNING EARLY`, {}, err);

    await unlinkFile(tempFilePath);
    // TODO: report error to sentry or send email to admin
    return;
  }

  let policyRecords: Record<string, Policy>;
  let ratingRecords: Record<string, RatingData>;
  try {
    const { formattedPolicies, ratingDocData } = await groupByPolicyId(dataArr, db);

    policyRecords = formattedPolicies;
    ratingRecords = ratingDocData;

    if (!policyRecords) throw new Error('Error formatting rows into policies');
  } catch (err: any) {
    // TODO: report error to admin (email?)
    reportErr('Errror grouping & formatting locations into policies', {}, err);
    return;
  }

  for (const [ratingDocId, ratingRecord] of Object.entries(ratingRecords)) {
    try {
      const ratingDocRef = ratingColRef.doc(ratingDocId);
      await ratingDocRef.set(ratingRecord);
    } catch (err: any) {
      error('Error saving rating doc', { err });
    }
  }

  // upload using provided policy ID ?? use set & update locations arr ??
  // TODO: batch all policy imports?

  let importedIds: string[] = [];
  let createErrors: any[] = [];

  // Loop through policies and create new record for each
  for (const [policyId, policyData] of Object.entries(policyRecords)) {
    try {
      info(`creating policy ${policyId}...`, { ...policyData });

      const policyRef = policiesColRef.doc(policyId);
      await throwIfExists(policyRef);

      const data: StagedPolicyImport = {
        ...policyData,
        importMeta: {
          status: 'new',
          eventId: event.id,
          targetCollection: COLLECTIONS.POLICIES,
        },
      };
      importStagingCol.doc(policyId).set(data);

      // await policyRef.set({ ...policyData });
      importedIds.push(policyId);
    } catch (err: any) {
      error(`Error created policy record in DB ${policyId}`, { err });
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

/**
 * Proup each row by policy ID, and set each row as location inside the policy. Policy level data will use the value in the last location row
 * @param {ParsedPolicyRow[]} data all rows from csv
 * @param {Firestore} firestore Firestore DB ref
 * @returns {Record<string, Policy>} object of policies, with policy ID as object key
 */
async function groupByPolicyId(data: ParsedPolicyRow[], firestore: Firestore) {
  let policies: Record<string, Omit<Policy, 'termPremium'>> = {};
  let ratingDocData: Record<string, RatingData> = {};
  const ts = Timestamp.now();

  for (const row of data) {
    let locId = getNewLocationId();
    const formattedLocation = formatPolicyLocation(row, locId, ts);

    const ratingDocId = uuid();
    const AALs = {
      inland: row.AALs?.inland,
      surge: row.AALs?.surge,
      tsunami: row.AALs?.tsunami,
    };
    const ratingData = getRatingData(formattedLocation, row.mgaCommissionPct as number, AALs);
    ratingDocData[ratingDocId] = ratingData;

    const locationWithRatingId = { ...formattedLocation, ratingDocId };

    const fees = row.fees;
    const taxes = row.taxes;

    const policyId = row.policyId as string;
    const existingPolicy = policies[policyId] || null;

    if (existingPolicy) {
      const updatedPolicy = {
        ...existingPolicy,
        fees,
        taxes,
        locations: { ...existingPolicy.locations, [locId]: locationWithRatingId },
      };

      policies[policyId] = updatedPolicy;
    } else {
      const policyWithoutLocation = await getPolicyWithoutLocation(row, ts, firestore);

      policies[policyId] = {
        ...policyWithoutLocation,
        fees,
        taxes,
        locations: {
          [locId]: locationWithRatingId,
        },
      };
    }
  }

  // Calc policy level term premium
  // const resultPolicies: Record<string, Policy> = {};
  const formattedPolicies: Record<string, Policy> = {};
  for (const [policyId, policy] of Object.entries(policies)) {
    const policyTermPremium = round(
      sumBy(Object.values(policy.locations), (l) => l.termPremium),
      2
    );

    const locations = Object.values(policy.locations);
    const inStatePremium = getInStatePremium(policy.homeState, locations);
    const outStatePremium = getOutStatePremium(policy.homeState, locations);

    const policyTaxes = recalcTaxes({
      premium: policyTermPremium,
      homeStatePremium: inStatePremium,
      outStatePremium: outStatePremium,
      taxes: policy.taxes,
      fees: policy.fees,
    });

    const price = sumFeesTaxesPremium(policy.fees, policyTaxes, policyTermPremium);

    formattedPolicies[policyId] = {
      ...policy,
      termPremium: policyTermPremium,
      inStatePremium,
      outStatePremium,
      taxes: policyTaxes,
      price,
    };
  }

  // return resultPolicies;
  return { formattedPolicies, ratingDocData };
}

function formatPolicyLocation(
  data: ParsedPolicyRow,
  locationId: string,
  ts: Timestamp
): PolicyLocation {
  const geoHash = geohashForLocation([data.coordinates!.latitude, data.coordinates!.longitude]);

  const effDate = data.effectiveDate || (data.policyEffectiveDate as Date);
  const expDate = data.expirationDate || (data.policyExpirationDate as Date);

  const effDateTs = Timestamp.fromDate(effDate);
  const expDateTs = Timestamp.fromDate(expDate);

  const { termDays, termPremium } = calcTerm(data.annualPremium, effDate, expDate);

  const location: PolicyLocation = {
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
    exists: true,
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

  const termDays = getTermDays(effDateTs.toDate(), expDateTs.toDate());
  // TODO: need to accomidate taxes and fee imports.
  // See importQuotes for reference

  const p: Omit<Policy, 'locations' | 'termPremium'> = {
    product: data.product as Product,
    status: POLICY_STATUS.PAID, // TODO: get status from csv
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

function getRatingData(data: PolicyLocation, mgaCommissionPct: number, AALs: any): RatingData {
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
      // techPremium: {
      //   inland: 0,
      //   surge: 0,
      //   tsunami: 0,
      // },
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
      directWrittenPremium: data.annualPremium,
      MGACommission: round(data.termPremium * mgaCommissionPct, 2),
      MGACommissionPct: mgaCommissionPct,
    },
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
}
