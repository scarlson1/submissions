import { StorageEvent } from 'firebase-functions/v2/storage';
import { projectID } from 'firebase-functions/params';
import { info } from 'firebase-functions/logger';
import { getStorage } from 'firebase-admin/storage';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { camelCase } from 'lodash'; // snakeCase
import path from 'path';
import os from 'os';
import fs from 'fs';
import {
  ParserHeaderArray,
  ParserHeaderTransformFunction,
  ParserOptionsArgs,
  parseStream,
} from 'fast-csv'; // format, parse, ParserHeaderTransformFunction,

import {
  COLLECTIONS,
  extractNumber,
  getNumber,
  policiesCollection,
  sendgridApiKey,
} from '../common';
import { sendAdminPolicyImportNotification } from '../services/sendgrid';

// TODO: create helper functions to reduce boilerplate (downloadFile(storage, filePath, etc.))

const IMPORT_POLICIES_FOLDER = 'importPolicies';
// IMPORTANT: The order of the headers array will should match the order of fields in the CSV, otherwise the data columns will not match.

const transformHeaders: ParserHeaderTransformFunction = (headers: ParserHeaderArray) => {
  return headers.map((h) => camelCase(h || ''));
};

// const HEADERS: ParserHeaderArray = [
//   'policyId',
//   'externalLocationId',
//   'product',
//   'limitA',
//   'limitB',
//   'limitC',
//   'limitD',
//   'deductible',
//   'latitude',
//   'longitude',
//   'addressLine1',
//   'addressLine2',
//   'city',
//   'state',
//   'postal',
//   'countyFIPS',
//   'effectiveDate',
//   'expirationDate',
//   'insuredFirstName',
//   'insuredLastName',
//   'insuredEmail',
//   'insuredPhone',
//   'userId',
//   'agentId',
//   'agentName',
//   'agencyId',
//   'agencyName',
//   // TODO: additional insureds
//   // TODO: mortgagee interest
//   'status',
//   'annualPremium',
//   'subproducerCommission',
//   // TODO: taxes and fees
//   'price',
// ];

interface PolicyRow {
  policyId: string;
  externalLocationId: string;
  product: string;
  limitA: string;
  limitB: string;
  limitC: string;
  limitD: string;
  deductible: string;
  latitude: string;
  longitude: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postal: string;
  countyFIPS: string;
  effectiveDate: string;
  expirationDate: string;
  insuredFirstName: string;
  insuredLastName: string;
  insuredEmail: string;
  insuredPhone: string;
  userId: string;
  agentId: string;
  agentName: string;
  agencyId: string;
  agencyName: string;
  // TODO: additional insureds
  // TODO: mortgagee interest
  status: string;
  annualPremium: string;
  subproducerCommission: string;
  // TODO: taxes and fees
  price: string;
}

interface TransformedPolicyRow extends Omit<PolicyRow, 'limitA'> {
  limitA: number | string;
}

const transformRow = (data: PolicyRow) => {
  console.log('DATA:', data);
  console.log('TYPE OF LIMITA: ', data.limitA, typeof data.limitA);

  return {
    ...data,
    displayName: `${data.insuredFirstName} ${data.insuredLastName}`.trim(),
    limitA: data.limitA ? parseInt(getNumber(data.limitA)) : '',
    limitB: data.limitB ? parseInt(getNumber(data.limitB)) : '',
    limitC: data.limitC ? parseInt(getNumber(data.limitC)) : '',
    limitD: data.limitD ? parseInt(getNumber(data.limitD)) : '',
    deductible: data.deductible ? parseInt(getNumber(data.deductible)) : '',
    effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : null,
    expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
    latitude: data.latitude ? extractNumber(data.latitude) : '',
    longitude: data.longitude ? extractNumber(data.longitude) : '',
    annualPremium: data.annualPremium ? parseFloat(getNumber(data.annualPremium)) : '',
    subproducerCommission: data.subproducerCommission
      ? parseFloat(getNumber(data.subproducerCommission))
      : '',
    price: data.price ? parseFloat(getNumber(data.price)) : '',
    // insuredPhone
    // DO TRANSFORMS IF NEEDED (convert to number, default values, etc.)
  };
};

// Return false if validation fails, otherwise true
const validateRow = (data: TransformedPolicyRow) => {
  if (typeof data.limitA !== 'number' || data.limitA < 100000) return false;

  // TODO: validate limits
  // TODO: validate deductible
  // TODO: validate effective and expiration dates, etc.

  return true;
};

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

  if (metageneration !== '1' || contentType !== 'text/csv' || !filePath) {
    console.log(
      `validation failed. contentType: ${contentType}. metageneration: ${metageneration}. filepath: ${filePath}`
    );
    return null;
  }

  const db = getFirestore();
  const policiesCollRef = policiesCollection(db);

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), `temp_portfolio_import_${fileName}`);

  await bucket.file(filePath).download({ destination: tempFilePath });
  info('File downloaded locally to', tempFilePath);

  const dataArr: any[] = [];
  const invalidRows: { rowNum: any; rowData: any }[] = [];

  const parseOptions: ParserOptionsArgs = {
    headers: transformHeaders,
    // headers: HEADERS,
    // ignoreEmpty: true,
    discardUnmappedColumns: true,
  };

  const stream = fs.createReadStream(tempFilePath);

  parseStream<PolicyRow, PolicyRow>(stream, parseOptions)
    .transform((data: PolicyRow) => transformRow(data))
    // TODO: validation
    .validate((data: TransformedPolicyRow): boolean => validateRow(data))
    .on('error', (err) => {
      console.error(err);
      fs.unlinkSync(tempFilePath);
      // update metadata --> status: error
      return;
    })
    .on('data', (row) => {
      console.log('ROW => ', row);
      dataArr.push(row);
    })
    .on('data-invalid', (row, rowNumber) => {
      console.log(`Invalid [rowNumber=${rowNumber}] [row=${JSON.stringify(row)}]`);
      invalidRows.push({
        rowNum: rowNumber,
        rowData: row,
      });
    })
    .on('end', (rowCount: number) => {
      console.log(`Finished parsing ${rowCount} rows`);
      fs.unlinkSync(tempFilePath);
      return handleParsedData(dataArr);
    });

  async function handleParsedData(data: any[]) {
    try {
      // for each row, create policy
      // save policy id to array (save in summary)
      let policyIds: string[] = [];
      let createErrors: any[] = [];

      for (let row of data) {
        try {
          // if (row.policyId) {
          //   await policiesCollRef.doc(row.policyId).set({
          //     ...row,
          //     metadata: {
          //       created: Timestamp.now(),
          //       updated: Timestamp.now(),
          //     },
          //   });
          //   policyIds.push(row.policyId);
          // } else {
          let newDocRef = await policiesCollRef.add({
            ...row,
            metadata: {
              created: Timestamp.now(),
              updated: Timestamp.now(),
            },
          });
          policyIds.push(newDocRef.id);
          // }
        } catch (err) {
          console.error(`ERROR CREATING POLICY DOC. ROW => ${JSON.stringify(row)}`);
          createErrors.push(row);
        }
      }

      console.log(
        `CREATED ${policyIds.length} policies from ${data.length} successfully parsed rows.`
      );

      // Save import summary
      let importSummaryColRef = db.collection(COLLECTIONS.DATA_IMPORTS);
      let summaryRef = await importSummaryColRef.add({
        importCollection: COLLECTIONS.POLICIES,
        importDocIds: policyIds,
        docCreationErrors: createErrors,
        invalidRows,
      });
      console.log(`SAVED IMPORT SUMMARY TO DOC ${summaryRef.id}`);

      console.log('PROJECT ID PARAM: ', projectID);

      // Send email notification
      const sgKey = sendgridApiKey.value();
      if (!sgKey) {
        const to = ['spencer.carlson@idemandinsurance.com'];
        let link;

        if (process.env.AUDIENCE !== 'LOCAL HUMANS') {
          to.push('ron.carlson@idemandinsurance.com');

          link = `https://console.firebase.google.com/project/${projectID}/firestore/data/~2F${COLLECTIONS.DATA_IMPORTS}~2F${summaryRef.id}`;
        }

        await sendAdminPolicyImportNotification(
          sgKey,
          to,
          policyIds.length,
          createErrors.length,
          invalidRows.length,
          fileName,
          link
        );
      } else {
        console.log('Policies imported. Missing SENDGRID_API_KEY env var to notify admins.');
      }

      return;
    } catch (err) {
      console.error(`ERROR CREATING POLICY DOCS: `, err);
      return;
    }
  }

  // TODO: update file metadata --> status: imported
  // return fs.unlinkSync(tempFilePath);
  return;
};
// https://console.firebase.google.com/project/idemand-submissions-dev/firestore/data/~2FagencySubmissions~2FzTkE8uDeseW4OK3hxudA
