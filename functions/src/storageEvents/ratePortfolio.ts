import { StorageEvent } from 'firebase-functions/v2/storage';
import { error, info, warn } from 'firebase-functions/logger';
import { defineInt, projectID, storageBucket } from 'firebase-functions/params';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { format, parse } from 'fast-csv';
import { snakeCase } from 'lodash';
import { AxiosInstance, AxiosResponse } from 'axios';

import {
  getNumber,
  splitChunks,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
  sendgridApiKey,
  audience,
} from '../common';
import { generateSRAccessToken, getSwissReInstance } from '../services';
import { swissReBody } from '../utils/rating/swissReBody.js';
import { getPremium } from '../utils/rating';
import { formatPremData, getSRVars, validateRow } from './getAALAndRatePortfolio';
import { sendMessage } from '../services/sendgrid';
import { addDays } from 'date-fns';
import { File, GetSignedUrlResponse } from '@google-cloud/storage';
import { extractSRAALs } from '../utils/rating/getAALs';

let swissReInstance: AxiosInstance;
let swissReInstanceTimestamp: number; // TODO: regenerate if > 10 mins
let tenMins = 60 * 1000 * 10;

const chunkCount = defineInt('SR_CHUNK_COUNT');
const PORTFOLIO_UPLOAD_FOLDER = 'ratePortfolio';

// TODO: RowType

function parseStreamToArray<RowType = any>(stream: fs.ReadStream) {
  return new Promise<{ dataArray: RowType[]; invalidRows: RowType[] }>((resolve, reject) => {
    const dataArray: any[] = [];
    const invalidRows: any[] = [];
    stream
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
        skip: data?.skip && data?.skip?.toLowerCase().trim() === 'true',
        google_maps_link: getGoogleMapsUrl(data.latitude, data.longitude),
      })) // If a row is invalid then a data-invalid event will be emitted with the row and the index.
      .validate((data: any): boolean => {
        if (data.skip) return true;
        return validateRow(data);
      })
      .on('error', (err: any) => {
        error(err);
        // fs.unlinkSync(tempFilePath);
        // return;
        reject(err);
      })
      .on('headers', (headers) => {
        info('HEADERS => ', headers);
      })
      .on('data', (row) => {
        info(`ROW (Location ID: ${row.location_id || 'no ID'}) => `, { ...row });
        dataArray.push(row);
      })
      .on('data-invalid', (row, rowNumber) => {
        warn(`Invalid [rowNumber=${rowNumber}] [row=${JSON.stringify(row)}]`);
        invalidRows.push({ ...row, rowNumber });
      })
      .on('end', async (rowCount: number) => {
        info(`Parsed ${rowCount} rows`);
        info('DATA ARRAY => ', dataArray);
        // if (tempFilePath) fs.unlinkSync(tempFilePath);
        resolve({ dataArray, invalidRows });

        // try {
        //   // await getAALs(dataArray);
        //   await splitAndRate(dataArray);

        //   await bucket.file(filePath).setMetadata({ metadata: { status: 'processed' } });
        // } catch (err) {
        //   await bucket.file(filePath).setMetadata({ metadata: { status: 'error' } });
        // }

        // return;
      });
  });
}

function getPremCalcVars(row: any) {
  return {
    AAL: {
      inland: row.inland,
      surge: row.surge,
      tsunami: row.tsunami,
    },
    limits: {
      limitA: row.cov_a_limit,
      limitB: row.cov_b_limit,
      limitC: row.cov_c_limit,
      limitD: row.cov_d_limit,
    },
    floodZone: row.flood_zone,
    state: row.state,
    basement: row.basement,
    priorLossCount: row.prior_loss_count || '0',
    commissionPct: row.commission_pct || 0.15,
  };
}

const calcPrem = (data: any[]) => {
  const result: any[] = [];

  for (let r of data) {
    try {
      if (r.inland === -1) {
        let msg = r.skip ? 'skip row' : r.errMsg || 'missing aals';
        throw new Error(msg);
      }
      let getPremProps = getPremCalcVars(r);
      const rowPremData = getPremium({ ...getPremProps, isPortfolio: true });

      const formattedPremData = formatPremData(rowPremData);

      result.push({
        ...r,
        ...formattedPremData,
      });
    } catch (err: any) {
      let errMsg = err?.message || null;
      if (errMsg !== 'skip row') {
        error(`ERROR (location: ${r.location_id || r.address_1 || '"no address_1"'}): `, {
          errMsg,
        });
      }

      result.push({
        ...r,
        basementMult: '',
        inlandHistoryMult: '',
        surgeHistoryMult: '',
        tsunamiHistoryMult: '',
        inlandFFEMult: '',
        surgeFFEMult: '',
        tsunamiFFEMult: '',
        inlandMult: '',
        surgeMult: '',
        tsunamiMult: '',
        inlandStateMult: '',
        surgeStateMult: '',
        tsunamiStateMult: '',
        inlandPM: '',
        surgePM: '',
        tsunamiPM: '',
        inlandRiskScore: '',
        surgeRiskScore: '',
        tsunamiRiskScore: '',
        inlandTechPrem: '',
        surgeTechPrem: '',
        tsunamiTechPrem: '',
        premiumSubtotal: '',
        minPrem: '',
        minPremiumAdj: '',
        provisionalPremium: '',
        subproducerAdj: '',
        premium: '',
        notes: 'Error calculating premium or missing AALs or skip row',
        errMsg,
      });
    }
  }

  return result;
};

function getSRPromise(data: any, i?: number) {
  // if (i === 1) {
  //   console.log('DEV - RETURNING SR REJECTION');
  //   return new Promise((resolve, reject) => {
  //     setTimeout(() => {
  //       reject(new Error('test throw error for retry refactor'));
  //     }, 50);
  //   });
  // }
  if (data.skip) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('skip row'));
      }, 50);
    });
  }
  if (!swissReInstance) throw Error('SwissReInstance undefined');
  const xmlBodyVars = getSRVars(data);
  const body = swissReBody(xmlBodyVars);

  return swissReInstance.post('/rate/sync/srxplus/losses', body, {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });
}

async function getAALs(parsedData: any[]) {
  try {
    const promises = parsedData.map((r, i) =>
      getSRPromise(r, i).catch((err: any) => {
        let errMsg = 'Error fetching AALs from Swiss Re.';
        if (err?.message && typeof err.message === 'string') errMsg = err.message;
        if (err?.response?.data) errMsg += ` ${[JSON.stringify(err.response.data)]}`;

        error(`Error fetching AAL for row index ${i}`, {
          errMsg,
          errRes: err?.response || null,
          errResData: err?.response?.data || null,
          err: { ...err },
        });

        return {
          data: undefined,
          errMsg,
        };
      })
    ) as Promise<
      | AxiosResponse<any, any>
      | {
          data: {
            errMsg: string;
          };
        }
    >[];

    // const results = await Promise.all(promises.map((p) => p.catch((e) => e)));
    // const validResults = results.filter((result) => !(result instanceof Error));

    let results = await Promise.all(promises);

    let aals = results.map((r) => ({
      ...extractSRAALs(r?.data?.expectedLosses),
      errMsg: r?.data?.errMsg || '',
    }));

    // let aals = results.map((r) =>
    //   r?.data?.expectedLosses
    //     ? { ...extractSRAALs(r?.data?.expectedLosses), errMsg: '' }
    //     : { inland: -1, surge: -1, tsunami: -1, errMsg: r?.data?.errMsg || '' }
    // );

    if (parsedData.length !== aals.length) {
      error('AAL COUNT NOT THE SAME AS ROW COUNT - RETURNING EARLY');
      throw new Error(
        'AAL count not same as row count. Cannot merge without risk if data mismatch'
      );
    }

    return parsedData.map((r, i) => ({ ...r, ...aals[i] }));
    // return calcPrem(merged)
  } catch (err: any) {
    error('AAL ERR: ', { ...err });
    throw err;
  }
}

async function getPremiumForChunk(chunk: any[]) {
  const chunkWithAAL = await getAALs(chunk);
  // info(`FINISHED FETCHING AAL FOR CHUNK (COUNT: ${currChunk})`, { ...chunkWithAAL });

  const filtered = chunkWithAAL.filter((row) => row.inland !== -1);
  const errorRows = chunkWithAAL.filter((row) => row.inland === -1);

  const ratedChunk = calcPrem(filtered);

  return { ratedChunk, errorRows };
}

async function splitAndRate(data: any[]) {
  let ratedArray: any[] = [];
  let chunkCountVal = chunkCount.value() || 100;
  let chunks = data.length > chunkCountVal ? splitChunks(data, chunkCountVal) : [data];
  // Add an extra array for retries
  chunks.push([]);
  let currChunk = 1;

  for (let chunk of chunks) {
    // retry array might be empty
    if (chunk.length) {
      const { ratedChunk, errorRows } = await getPremiumForChunk(chunk);

      info(
        `RATED CHUNK (${currChunk}/${chunks.length}) [SUCCESS COUNT: ${ratedChunk.length}; ERROR COUNT: ${errorRows.length}]: `
      );

      if (currChunk !== chunks.length) await waitMilliSeconds(30000);

      ratedArray = [...ratedArray, ...ratedChunk];
      // Add error rows to "retry" chunk
      if (currChunk !== chunks.length) {
        chunks[chunks.length - 1].push(...errorRows);
      } else {
        ratedArray = [...ratedArray, ...errorRows];
      }
    }
    currChunk++;
  }

  return ratedArray;
}

async function unlinkFile(filePath: string) {
  try {
    if (filePath) fs.unlinkSync(filePath);
  } catch (err: any) {
    error('Error unlinking file ', { errMsg: err?.message, err });
  }
}

function waitMilliSeconds(ms: number = 1000) {
  return new Promise<void>((resolve, reject) => {
    info(`Waiting ${ms}ms to space out Swiss Re API calls`);
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

function getGoogleMapsUrl(latitude: number | undefined, longitude: number | undefined) {
  if (!(latitude && longitude)) return '';
  return `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`;
}

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name; // File path in the bucket.
  const fileName = path.basename(filePath || '');
  const contentType = event.data.contentType;
  const metageneration = event.data.metageneration as unknown;
  info('FILE UPLOAD DETECTED: ', { fileName });
  // TODO: better filtering to only run on wanted uploads & idempotency

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

  // TODO: check meetadata for processed status
  const eventAge = Date.now() - Date.parse(event.time);
  const eventMaxAge = 1000 * 60 * 10; // 10 mins

  // Ignore events that are too old
  if (eventAge > eventMaxAge) {
    info(`Dropping event ${event.id} with age ${eventAge} ms.`, { ...event });
    return;
  }

  const clientId = swissReClientId.value();
  const clientSecret = swissReClientSecret.value();
  const subKey = swissReSubscriptionKey.value();

  swissReInstance = swissReInstance || getSwissReInstance(clientId, clientSecret, subKey);

  const shouldGenerateNewToken =
    !swissReInstanceTimestamp || new Date().getTime() - swissReInstanceTimestamp > tenMins;

  if (!swissReInstance.defaults.headers.common.Authorization || shouldGenerateNewToken) {
    let accessToken = await generateSRAccessToken(clientId, clientSecret);
    swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    swissReInstanceTimestamp = new Date().getTime();
  }

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), `temp_SR_${fileName}`);

  await bucket.file(filePath).download({ destination: tempFilePath });
  info(`File downloaded locally: ${tempFilePath}`);

  const storageFile = bucket.file(
    `${PORTFOLIO_UPLOAD_FOLDER}/processed_${fileName}`
  ) as unknown as File;

  async function writeToStorage(data: any[]) {
    info(`WRITING TO STORAGE FILE: ${storageFile.name}`);
    const csvStream = format({ headers: true });

    data.forEach((r) => csvStream.write(r));
    csvStream.end();

    csvStream
      .pipe(storageFile.createWriteStream())
      .on('finish', () => {
        info(`FINISHED WRITING TO ${storageFile.name}`);
        return;
      })
      .on('error', (err) => {
        throw err;
      });
  }

  try {
    const { dataArray, invalidRows } = await parseStreamToArray(fs.createReadStream(tempFilePath));

    // if (tempFilePath) fs.unlinkSync(tempFilePath);
    await unlinkFile(tempFilePath);
    info(
      `FINISHED PARSING FILE (${dataArray.length} VALID ROWS - ${invalidRows.length} INVALID ROWS)`
    );

    const ratedArray = await splitAndRate(dataArray);

    await writeToStorage(ratedArray);

    await bucket.file(filePath).setMetadata({ metadata: { status: 'processed' } });

    try {
      await notifyAdmin(sendgridApiKey.value(), storageFile, fileName);
    } catch (err: any) {
      error('Error generating file link and sending admin notification', {
        errMsg: err?.message || null,
      });
    }

    return;
  } catch (err: any) {
    error('ERROR: ', { err });
    await unlinkFile(tempFilePath);
    // TODO: send error email to admin
    return;
  }
};

async function notifyAdmin(sgKey: string, storageFile: File, fileName: string = 'File') {
  const storageLink = `https://console.cloud.google.com/storage/browser/_details/${storageBucket.value()}/${
    storageFile.name
  };tab=live_object?project=${projectID.value()}`;

  const downloadURL: GetSignedUrlResponse = await storageFile.getSignedUrl({
    action: 'read',
    expires: addDays(new Date(), 7),
  });

  const to = ['spencer.carlson@idemandinsurance.com'];
  if (audience.value() === 'PROD HUMANS') to.push('ron.carlson@idemandinsurance.com');

  const msgBody = `<div>
      <p>
        Portfolio rating complete (<a href=${downloadURL[0]}>download: ${fileName}</a>). Download link expires in 7 days.
      </p>
      <div style="padding-top: 8px">
        <a href="${storageLink}">View in storage.</a>
      </div>
    </div>`;

  await sendMessage(sgKey, to, msgBody, 'Portfolio rating complete');
}
