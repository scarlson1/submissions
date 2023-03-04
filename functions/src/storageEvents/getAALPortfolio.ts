import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { getStorage } from 'firebase-admin/storage';
// import { Storage } from '@google-cloud/storage';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { format, parse } from 'fast-csv';
import { snakeCase } from 'lodash';

import { getNumber } from '../common';
import { getSwissReInstance } from '../services/swissRe';
import { swissReBody } from '../firestoreEvents/getSubmissionAAL';

const swissReClientId = defineSecret('SWISS_RE_CLIENT_ID');
const swissReClientSecret = defineSecret('SWISS_RE_CLIENT_SECRET');
const swissReSubscriptionKey = defineSecret('SWISS_RE_SUBSCRIPTION_KEY');

// const HEADERS = ['address_1', 'address_2', 'city', 'state', 'zip', 'latitude', 'longitude',]
const PORTFOLIO_UPLOAD_FOLDER = 'portfolio-aal';

export const getAALPortfolio = functions
  .runWith({ secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] })
  .storage.object()
  .onFinalize(async (object) => {
    const fileBucket = object.bucket;
    const filePath = object.name; // File path in the bucket.
    const fileName = path.basename(filePath || '');
    const contentType = object.contentType;
    const metageneration = object.metageneration;
    console.log('FILE UPLOAD DETECTED: ', fileName);
    // TODO: better filtering to only run on wanted uploads
    if (
      !object.name?.startsWith(`${PORTFOLIO_UPLOAD_FOLDER}/`) ||
      fileName.startsWith('processed') ||
      fileName.startsWith('sr')
    ) {
      functions.logger.log(`Ignoring upload "${object.name}" because it was already processed.`);
      return null;
    }

    if (metageneration !== '1' || contentType !== 'text/csv' || !filePath) {
      console.log(
        `validation failed. contentType: ${contentType}. metageneration: ${metageneration}. filepath: ${filePath}`
      );
      return null;
    }

    const clientId = process.env.SWISS_RE_CLIENT_ID;
    const clientSecret = process.env.SWISS_RE_CLIENT_SECRET;
    const subKey = process.env.SWISS_RE_SUBSCRIPTION_KEY;
    if (!(clientId && clientSecret && subKey)) {
      console.log('MISSING SR CREDENTIALS. RETURNING EARLY');
      return;
    }

    const swissReInstance = getSwissReInstance(clientId, clientSecret, subKey);
    const storage = getStorage();
    const bucket = storage.bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), `temp_SR_${fileName}`);

    await bucket.file(filePath).download({ destination: tempFilePath });
    functions.logger.log('File downloaded locally to', tempFilePath);

    const dataArray: any[] = [];

    fs.createReadStream(tempFilePath)
      .pipe(parse({ headers: (headers) => headers.map((h) => snakeCase(h || '')) }))
      .transform((data: any): any => ({
        ...data,
        // latitude: parseFloat(data.latitude),
        // longitude: parseFloat(data.longitude),
        cov_a_rcv: data.cov_a_rcv ? parseInt(getNumber(data.cov_a_rcv)) : '',
        cov_c_rcv: data.cov_c_rcv ? parseInt(getNumber(data.cov_c_rcv)) : '',
        cov_d_rcv: data.cov_d_rcv ? parseInt(getNumber(data.cov_d_rcv)) : '',
        rcv_total: data.rcv_total ? parseInt(getNumber(data.rcv_total)) : '',
        cov_a_limit: data.cov_a_limit ? parseInt(getNumber(data.cov_a_limit)) : '',
        cov_c_limit: data.cov_c_limit ? parseInt(getNumber(data.cov_c_limit)) : '',
        cov_d_limit: data.cov_d_limit ? parseInt(getNumber(data.cov_d_limit)) : '',
        total_coverage_limit: data.total_coverage_limit
          ? parseInt(getNumber(data.total_coverage_limit))
          : '',
        deductible: parseInt(getNumber(data.deductible)) || 3000,
      }))
      .on('error', (err) => {
        console.error(err);
        fs.unlinkSync(tempFilePath);
        return;
      })
      .on('data', (row) => {
        console.log('ROW => ', row);
        dataArray.push(row);
      })
      .on('data-invalid', (row, rowNumber) =>
        console.log(`Invalid [rowNumber=${rowNumber}] [row=${JSON.stringify(row)}]`)
      )
      .on('end', async (rowCount: number) => {
        console.log(`Parsed ${rowCount} rows`);
        console.log('DATA ARRAY => ', dataArray);
        fs.unlinkSync(tempFilePath);

        try {
          await getAALs(dataArray);
          await bucket.file(filePath).setMetadata({ metadata: { status: 'processed' } });
        } catch (err) {
          await bucket.file(filePath).setMetadata({ metadata: { status: 'error' } });
        }

        return;
      });

    function getSRPromise(data: any) {
      const xmlBodyVars = getSRVars(data);
      console.log('BODY VARS => ', xmlBodyVars);
      const body = swissReBody(xmlBodyVars);

      return swissReInstance.post('/rate/sync/srxplus/losses', body, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });
    }

    const extractAAL = (expectedLosses: any) => {
      let code200Index = expectedLosses.findIndex((o: any) => o.perilCode === '200');
      let code300Index = expectedLosses.findIndex((o: any) => o.perilCode === '300');

      let inlandAAL,
        surgeAAL = 0;
      if (code200Index !== -1) {
        surgeAAL = expectedLosses[code200Index]?.preCatLoss ?? 0;
      }
      if (code300Index !== -1) {
        inlandAAL = expectedLosses[code300Index]?.preCatLoss ?? 0;
      }

      return { inlandAAL, surgeAAL };
    };

    async function getAALs(parsedData: any[]) {
      try {
        const promises = parsedData.map((r) => getSRPromise(r));

        let results = await Promise.all(promises);
        results.forEach((result) => console.log('DATA: ', result.data));
        let aals = results.map((r) =>
          r.data?.expectedLosses
            ? extractAAL(r.data?.expectedLosses)
            : { inlandAAL: 0, surgeAAL: 0 }
        );

        console.log('AALs: ', aals);

        if (parsedData.length !== aals.length) {
          console.log('AAL COUNT NOT THE SAME AS ROW COUNT - RETURNING EARLY');
          throw new Error(
            'AAL count not same as row count. Cannot merge without risk if data mismatch'
          );
        }

        let merged = parsedData.map((r, i) => ({ ...r, ...aals[i] }));

        console.log('MERGED: ', merged);
        return writeToStorage(merged);
      } catch (err) {
        console.log('ERROR: ', err);
        throw err;
      }
    }

    // const storage = new Storage();
    const storageFile = bucket.file(`${PORTFOLIO_UPLOAD_FOLDER}-processed/processed_${fileName}`); // .csv

    async function writeToStorage(data: any[]) {
      const csvStream = format({ headers: true });

      data.forEach((r) => csvStream.write(r));
      csvStream.end();

      csvStream
        .pipe(storageFile.createWriteStream())
        .on('finish', () => console.log(`FINISHED WRITING TO ${storageFile.name}`));
    }

    return;
  });

function getSRVars(row: any) {
  return {
    lat: row.latitude,
    lng: row.longitude,
    rcvTotal: row.rcv_total,
    rcvAB: row.cov_a_rcv,
    rcvC: row.cov_c_rcv,
    rcvD: row.cov_d_rcv,
    limitAB: row.cov_a_limit,
    limitC: row.cov_c_limit,
    limitD: row.cov_d_limit,
    deductible: row.deductible,
    numStories: row.num_stories || 1,
    externalRef: row.location_id || 'idemand',
  };
}
