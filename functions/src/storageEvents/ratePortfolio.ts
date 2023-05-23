import { StorageEvent } from 'firebase-functions/v2/storage';
import { error, info, warn } from 'firebase-functions/logger';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { format, parse } from 'fast-csv';
import { snakeCase } from 'lodash';
import { AxiosInstance } from 'axios';

import {
  getNumber,
  splitChunks,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common';
import { generateSRAccessToken, getSwissReInstance } from '../services';
import { swissReBody } from '../utils/rating/swissReBody.js';
import { getPremium } from '../utils/rating';
import { formatPremData, getPremCalcVars, getSRVars, validateRow } from './getAALAndRatePortfolio';

let swissReInstance: AxiosInstance;

const CHUNK_COUNT = 2;
const PORTFOLIO_UPLOAD_FOLDER = 'ratePortfolio';

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name; // File path in the bucket.
  const fileName = path.basename(filePath || '');
  const contentType = event.data.contentType;
  const metageneration = event.data.metageneration as unknown;
  console.log('FILE UPLOAD DETECTED: ', fileName);
  // TODO: better filtering to only run on wanted uploads

  if (!event.data.name?.startsWith(`${PORTFOLIO_UPLOAD_FOLDER}/`)) {
    info(
      `Ignoring upload "${event.data.name}" because is not in the "/${PORTFOLIO_UPLOAD_FOLDER}/*" folder.`
    );
    return null;
  }

  if (fileName.startsWith('processed') || fileName.startsWith('sr')) {
    info(`Ignoring upload "${filePath}" because it was already processed.`);
    return null;
  }

  if (metageneration !== '1' || contentType !== 'text/csv' || !filePath) {
    warn(
      `validation failed. contentType: ${contentType}. metageneration: ${metageneration}. filepath: ${filePath}`
    );
    return null;
  }

  const clientId = swissReClientId.value();
  const clientSecret = swissReClientSecret.value();
  const subKey = swissReSubscriptionKey.value();

  swissReInstance = swissReInstance || getSwissReInstance(clientId, clientSecret, subKey);
  if (!swissReInstance.defaults.headers.common.Authorization) {
    let accessToken = await generateSRAccessToken(clientId, clientSecret);
    swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
  }

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), `temp_SR_${fileName}`);

  await bucket.file(filePath).download({ destination: tempFilePath });
  info('File downloaded locally to', tempFilePath);

  const dataArray: any[] = [];
  const invalidRows: any[] = [];

  let ratedArray: any[] = [];

  fs.createReadStream(tempFilePath)
    .pipe(parse({ headers: (headers) => headers.map((h) => snakeCase(h || '')) }))
    .transform((data: any): any => ({
      ...data,
      // latitude: parseFloat(data.latitude),
      // longitude: parseFloat(data.longitude),
      // building_rcv: data.building_rcv ? parseInt(getNumber(data.building_rcv)) : '',
      cov_a_rcv: data.cov_a_rcv ? parseInt(getNumber(data.cov_a_rcv)) : '',
      cov_b_rcv: data.cov_b_rcv ? parseInt(getNumber(data.cov_b_rcv)) : 0,
      cov_c_rcv: data.cov_c_rcv ? parseInt(getNumber(data.cov_c_rcv)) : 0,
      cov_d_rcv: data.cov_d_rcv ? parseInt(getNumber(data.cov_d_rcv)) : 0,
      total_rcv: data.total_rcv ? parseInt(getNumber(data.total_rcv)) : '',
      cov_a_limit: data.cov_a_limit ? parseInt(getNumber(data.cov_a_limit)) : '',
      cov_b_limit: data.cov_b_limit ? parseInt(getNumber(data.cov_b_limit)) : 0,
      cov_c_limit: data.cov_c_limit ? parseInt(getNumber(data.cov_c_limit)) : 0,
      cov_d_limit: data.cov_d_limit ? parseInt(getNumber(data.cov_d_limit)) : 0,
      total_limits: data.total_limits ? parseInt(getNumber(data.total_limits)) : '',
      deductible: parseInt(getNumber(data.deductible)) || '',
    })) // If a row is invalid then a data-invalid event will be emitted with the row and the index.
    .validate((data: any): boolean => {
      return validateRow(data);
    })
    .on('error', (err) => {
      error(err);
      fs.unlinkSync(tempFilePath);
      return;
    })
    .on('headers', (headers) => {
      info('HEADERS => ', headers);
    })
    .on('data', (row) => {
      info('ROW => ', row);
      dataArray.push(row);
    })
    .on('data-invalid', (row, rowNumber) => {
      warn(`Invalid [rowNumber=${rowNumber}] [row=${JSON.stringify(row)}]`);
      invalidRows.push({ ...row, rowNumber });
    })
    .on('end', async (rowCount: number) => {
      info(`Parsed ${rowCount} rows`);
      info('DATA ARRAY => ', dataArray);
      if (tempFilePath) fs.unlinkSync(tempFilePath);

      try {
        // await getAALs(dataArray);
        await splitAndRate(dataArray);

        await bucket.file(filePath).setMetadata({ metadata: { status: 'processed' } });
      } catch (err) {
        await bucket.file(filePath).setMetadata({ metadata: { status: 'error' } });
      }

      return;
    });

  async function splitAndRate(data: any[]) {
    let chunks = splitChunks(data, CHUNK_COUNT);

    for (let chunk of chunks) {
      const ratedChunk = await getAALs(chunk);
      info('RATED CHUNK: ', ratedChunk);
      ratedArray = [...ratedArray, ...ratedChunk];
    }

    info('WRITING RESULT TO CSV');
    info(ratedArray);
    return writeToStorage(ratedArray);
  }

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

    let inlandAAL = 0;
    let surgeAAL = 0;
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
        r.data?.expectedLosses ? extractAAL(r.data?.expectedLosses) : { inlandAAL: 0, surgeAAL: 0 }
      );

      console.log('AALs: ', aals);

      if (parsedData.length !== aals.length) {
        console.log('AAL COUNT NOT THE SAME AS ROW COUNT - RETURNING EARLY');
        throw new Error(
          'AAL count not same as row count. Cannot merge without risk if data mismatch'
        );
      }

      let merged = parsedData.map((r, i) => ({ ...r, ...aals[i] }));

      const result: any[] = [];

      for (let r of merged) {
        try {
          let getPremProps = getPremCalcVars(r);
          const rowPremData = getPremium({ ...getPremProps, isPortfolio: true });

          const formattedPremData = formatPremData(rowPremData);

          result.push({
            ...r,
            ...formattedPremData,
          });
        } catch (err: any) {
          error('ERROR: ', { msg: err?.message || null });
          result.push({
            ...r,
            basementMult: '',
            inlandHistoryMult: '',
            surgeHistoryMult: '',
            inlandFFEMult: '',
            surgeFFEMult: '',
            inlandMult: '',
            surgeMult: '',
            inlandStateMult: '',
            surgeStateMult: '',
            inlandPM: '',
            surgePM: '',
            inlandRiskScore: '',
            surgeRiskScore: '',
            inlandTechPrem: '',
            surgeTechPrem: '',
            premiumSubtotal: '',
            minPrem: '',
            minPremiumAdj: '',
            provisionalPremium: '',
            subproducerAdj: '',
            premium: '',
            notes: 'Error calculating premium',
          });
        }
      }

      info(`INVALID ROWS (COUNT: ${invalidRows.length}): `, invalidRows);
      // return writeToStorage(result);
      return result;
    } catch (err: any) {
      console.log('ERR: ', err);
      console.log('ERROR: ', err?.response?.data);
      throw err;
    }
  }

  const storageFile = bucket.file(`${PORTFOLIO_UPLOAD_FOLDER}/processed_${fileName}`);

  async function writeToStorage(data: any[]) {
    const csvStream = format({ headers: true });

    data.forEach((r) => csvStream.write(r));
    csvStream.end();

    csvStream
      .pipe(storageFile.createWriteStream())
      .on('finish', () => console.log(`FINISHED WRITING TO ${storageFile.name}`));
  }

  return;
};

// import { StorageEvent } from 'firebase-functions/v2/storage';
// import { logger } from 'firebase-functions/v1';
// import { getStorage } from 'firebase-admin/storage';
// import path from 'path';
// import os from 'os';
// import fs from 'fs';
// import { format, parse } from 'fast-csv';
// import { snakeCase } from 'lodash';
// import axios from 'axios';

// const CHUNK_COUNT = 2;
// const TEST_UPLOAD_FOLDER = 'test';

// /**
//  * Split an array of items into array of provided size
//  * @param data array of data
//  * @param size number of items in each chunk
//  */
// function splitChunks(data: any[], size: number = CHUNK_COUNT) {
//   let chunks = [];
//   for (let i = 0; i < data.length; i += size) chunks.push(data.slice(i, i + size));

//   return chunks;
// }

// export default async (event: StorageEvent) => {
//   const fileBucket = event.bucket;
//   const filePath = event.data.name; // File path in the bucket.
//   const fileName = path.basename(filePath || '');
//   const contentType = event.data.contentType;
//   const metageneration = event.data.metageneration as unknown;
//   console.log('FILE UPLOAD DETECTED: ', fileName);

//   console.log('is in test folder: ', event.data.name?.startsWith(`${TEST_UPLOAD_FOLDER}/`));

//   if (!event.data.name?.startsWith(`${TEST_UPLOAD_FOLDER}/`)) {
//     logger.log(
//       `Ignoring upload "${event.data.name}" because is not in the "/${TEST_UPLOAD_FOLDER}/*" folder. **TEST**`
//     );
//     return null;
//   }

//   if (fileName.startsWith('processed') || fileName.startsWith('sr')) {
//     logger.log(`Ignoring upload "${filePath}" because it was already processed.`);
//     return null;
//   }

//   if (metageneration !== '1' || contentType !== 'text/csv' || !filePath) {
//     console.log(
//       `validation failed. contentType: ${contentType}. metageneration: ${metageneration}. filepath: ${filePath}`
//     );
//     return null;
//   }

//   const storage = getStorage();
//   const bucket = storage.bucket(fileBucket);
//   const tempFilePath = path.join(os.tmpdir(), `temp_SR_${fileName}`);

//   await bucket.file(filePath).download({ destination: tempFilePath });
//   logger.log('File downloaded locally to', tempFilePath);

//   const dataArray: any[] = [];
//   const invalidRows: any[] = [];

//   let ratedArray: any[] = [];

//   fs.createReadStream(tempFilePath)
//     .pipe(parse({ headers: (headers) => headers.map((h) => snakeCase(h || '')) }))
//     // .transform((data: any): any => ({
//     //   ...data,
//     //   cov_a_rcv: data.cov_a_rcv ? parseInt(getNumber(data.cov_a_rcv)) : '',
//     //   cov_b_rcv: data.cov_b_rcv ? parseInt(getNumber(data.cov_b_rcv)) : 0,
//     //   cov_c_rcv: data.cov_c_rcv ? parseInt(getNumber(data.cov_c_rcv)) : 0,
//     //   cov_d_rcv: data.cov_d_rcv ? parseInt(getNumber(data.cov_d_rcv)) : 0,
//     //   total_rcv: data.total_rcv ? parseInt(getNumber(data.total_rcv)) : '',
//     //   cov_a_limit: data.cov_a_limit ? parseInt(getNumber(data.cov_a_limit)) : '',
//     //   cov_b_limit: data.cov_b_limit ? parseInt(getNumber(data.cov_b_limit)) : 0,
//     //   cov_c_limit: data.cov_c_limit ? parseInt(getNumber(data.cov_c_limit)) : 0,
//     //   cov_d_limit: data.cov_d_limit ? parseInt(getNumber(data.cov_d_limit)) : 0,
//     //   total_limits: data.total_limits ? parseInt(getNumber(data.total_limits)) : '',
//     //   deductible: parseInt(getNumber(data.deductible)) || '',
//     // })) // If a row is invalid then a data-invalid event will be emitted with the row and the index.
//     // .validate((data: any): boolean => {
//     //   return validateRow(data);
//     // })
//     .on('error', (err) => {
//       console.error(err);
//       fs.unlinkSync(tempFilePath);
//       return;
//     })
//     .on('headers', (headers) => {
//       console.log('HEADERS => ', headers);
//     })
//     .on('data', (row) => {
//       console.log('ROW => ', row);
//       dataArray.push(row);
//     })
//     .on('data-invalid', (row, rowNumber) => {
//       console.warn(`Invalid [rowNumber=${rowNumber}] [row=${JSON.stringify(row)}]`);
//       invalidRows.push({ ...row, rowNumber });
//     })
//     .on('end', async (rowCount: number) => {
//       console.log(`Parsed ${rowCount} rows`);
//       console.log('DATA ARRAY => ', dataArray);
//       if (tempFilePath) fs.unlinkSync(tempFilePath);

//       try {
//         await splitAndRate(dataArray);

//         await bucket.file(filePath).setMetadata({ metadata: { status: 'processed' } });
//       } catch (err) {
//         await bucket.file(filePath).setMetadata({ metadata: { status: 'error' } });
//       }

//       return;
//     });

//   async function splitAndRate(data: any[]) {
//     let chunks = splitChunks(data, CHUNK_COUNT);

//     for (let chunk of chunks) {
//       console.log('fetching data for chunk');
//       const ratedChunk = await getAALs(chunk);

//       console.log('RATED CHUNK: ', ratedChunk);
//       ratedArray = [...ratedArray, ...ratedChunk];
//     }

//     console.log('WRITING RESULT TO CSV');
//     console.log(ratedArray);
//     return writeToStorage(ratedArray);
//   }

//   function getSRPromise(data: any, id: any) {
//     return axios.get(`https://jsonplaceholder.typicode.com/todos/${id}`);
//   }

//   async function getAALs(parsedData: any[]) {
//     try {
//       const promises = parsedData.map((r) => getSRPromise(r, r.id));

//       let results = await Promise.all(promises);
//       results.forEach((result) => console.log('DATA: ', result.data));

//       let merged = parsedData.map((r, i) => ({ ...r, ...results[i].data }));

//       console.log(`INVALID ROWS (COUNT: ${invalidRows.length}): `, invalidRows);

//       return merged;
//     } catch (err: any) {
//       console.log('ERR: ', err);
//       console.log('ERROR: ', err?.response?.data);
//       throw err;
//     }
//   }

//   const storageFile = bucket.file(`${TEST_UPLOAD_FOLDER}/processed_${fileName}`);

//   async function writeToStorage(data: any[]) {
//     const csvStream = format({ headers: true });

//     data.forEach((r) => csvStream.write(r));
//     csvStream.end();

//     csvStream
//       .pipe(storageFile.createWriteStream())
//       .on('finish', () => console.log(`FINISHED WRITING TO ${storageFile.name}`));
//   }

//   return;
// };
