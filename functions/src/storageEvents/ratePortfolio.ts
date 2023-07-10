import { StorageEvent } from 'firebase-functions/v2/storage';
import { error, info } from 'firebase-functions/logger';
import { defineInt, projectID, storageBucket } from 'firebase-functions/params';
import { getStorage } from 'firebase-admin/storage';
import { File, GetSignedUrlResponse } from '@google-cloud/storage';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { AxiosInstance, AxiosResponse } from 'axios';
import { addDays } from 'date-fns';

import {
  getNumber,
  splitChunks,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
  sendgridApiKey,
  audience,
  unlinkFile,
  Nullable,
} from '../common';
import { generateSRAccessToken, getSwissReInstance } from '../services';
import { swissReBody } from '../utils/rating/swissReBody.js';
import { getPremium } from '../utils/rating';
import { sendMessage } from '../services/sendgrid';
import { extractSRAALs } from '../utils/rating/getAALs';
import {
  parseStreamToArray,
  shouldReturnEarly,
  // transformHeadersCamelCase,
  transformHeadersSnakeCase,
  writeArrayToStorage as writeToStorage,
} from '../utils';

let swissReInstance: AxiosInstance;
let swissReInstanceTimestamp: number; // TODO: regenerate if > 10 mins
const tenMins = 60 * 1000 * 10;

const chunkCount = defineInt('SR_CHUNK_COUNT');
const PORTFOLIO_UPLOAD_FOLDER = 'ratePortfolio';
const SR_WAIT_MS = 30000;

interface IRow extends Record<string, string> {
  cov_a_rcv: string;
  cov_b_rcv: string;
  cov_c_rcv: string;
  cov_d_rcv: string;
  total_rcv: string;
  cov_a_limit: string;
  cov_b_limit: string;
  cov_c_limit: string;
  cov_d_limit: string;
  total_limits: string;
  deductible: string;
}
interface TRow extends Record<string, any> {
  cov_a_rcv: number;
  cov_b_rcv: number;
  cov_c_rcv: number;
  cov_d_rcv: number;
  total_rcv: number;
  cov_a_limit: number;
  cov_b_limit: number;
  cov_c_limit: number;
  cov_d_limit: number;
  total_limits: number;
  deductible: number;
}

export function validateRow(data: any) {
  if (!data.cov_a_rcv) {
    info(`INVALID - "cov_a_rcv" - VALUE: ${data.cov_a_rcv}`);
    return false;
  }
  if (!data.cov_b_rcv && data.cov_b_rcv !== 0) {
    info(`INVALID - "cov_b_rcv" - VALUE: ${data.cov_b_rcv} - TYPE: ${typeof data.cov_b_rcv}`);
    return false;
  }
  if (!data.cov_c_rcv && data.cov_c_rcv !== 0) {
    info(`INVALID - "cov_c_rcv" - VALUE: ${data.cov_c_rcv}`);
    return false;
  }
  if (!data.cov_d_rcv && data.cov_d_rcv !== 0) {
    info(`INVALID - "cov_d_rcv" - VALUE: ${data.cov_d_rcv}`);
    return false;
  }
  if (!data.cov_a_limit) {
    info(`INVALID - "cov_a_limit" - VALUE: ${data.cov_a_limit}`);
    return false;
  }
  if (!data.cov_b_limit && data.cov_b_limit !== 0) {
    info(`INVALID - "cov_b_limit" - VALUE: ${data.cov_b_limit}`);
    return false;
  }
  if (!data.cov_c_limit && data.cov_c_limit !== 0) {
    info(`INVALID - "cov_c_limit" - VALUE: ${data.cov_c_limit}`);
    return false;
  }
  if (!data.cov_d_limit && data.cov_d_limit !== 0) {
    info(`INVALID - "cov_d_limit" - VALUE: ${data.cov_d_limit}`);
    return false;
  }
  if (!data.deductible) {
    info(`INVALID - "deductible" - VALUE ${data.deductible}`);
    return false;
  }
  if (!data.latitude) {
    info(`INVALID - "latitude" - VALUE ${data.latitude}`);
    return false;
  }
  if (!data.longitude) {
    info(`INVALID - "longitude" - VALUE ${data.longitude}`);
    return false;
  }
  if (!data.state) {
    info(`INVALID - "state" - VALUE ${data.state}`);
    return false;
  }

  return true;
}

function transformRow(data: IRow): Nullable<TRow> {
  return {
    ...data,
    cov_a_rcv: data.cov_a_rcv ? parseInt(getNumber(data.cov_a_rcv)) : null, // '',
    cov_b_rcv: data.cov_b_rcv ? parseInt(getNumber(data.cov_b_rcv)) : 0,
    cov_c_rcv: data.cov_c_rcv ? parseInt(getNumber(data.cov_c_rcv)) : 0,
    cov_d_rcv: data.cov_d_rcv ? parseInt(getNumber(data.cov_d_rcv)) : 0,
    total_rcv: data.total_rcv ? parseInt(getNumber(data.total_rcv)) : null, // TODO: calc instead ??
    cov_a_limit: data.cov_a_limit ? parseInt(getNumber(data.cov_a_limit)) : null, // '',
    cov_b_limit: data.cov_b_limit ? parseInt(getNumber(data.cov_b_limit)) : 0,
    cov_c_limit: data.cov_c_limit ? parseInt(getNumber(data.cov_c_limit)) : 0,
    cov_d_limit: data.cov_d_limit ? parseInt(getNumber(data.cov_d_limit)) : 0,
    total_limits: data.total_limits ? parseInt(getNumber(data.total_limits)) : null, // '',
    deductible: data.deductible ? parseInt(getNumber(data.deductible)) : null, // '',
    skip: data?.skip && data?.skip?.toLowerCase().trim() === 'true',
    google_maps_link: getGoogleMapsUrl(data.latitude, data.longitude),
  };
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

export function formatPremData(rowPremData: any) {
  const premium = rowPremData?.premiumData?.directWrittenPremium ?? '';
  const minPrem = rowPremData?.minPremium ?? '';
  const inlandMult = rowPremData?.secondaryFactorMults?.inland ?? '';
  const surgeMult = rowPremData?.secondaryFactorMults?.surge ?? '';
  const tsunamiMult = rowPremData?.secondaryFactorMults?.tsunami ?? '';
  const basementMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.basementMult ?? '';
  const inlandHistoryMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.historyMult?.inland ?? '';
  const surgeHistoryMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.historyMult?.surge ?? '';
  const tsunamiHistoryMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.historyMult?.tsunami ?? '';
  const inlandFFEMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.ffeMult.inland ?? '';
  const surgeFFEMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.ffeMult.surge ?? '';
  const tsunamiFFEMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.ffeMult.tsunami ?? '';
  const inlandStateMult = rowPremData?.stateMultipliers?.inland ?? '';
  const surgeStateMult = rowPremData?.stateMultipliers?.surge ?? '';
  const tsunamiStateMult = rowPremData?.stateMultipliers?.tsunami ?? '';
  const inlandPM = rowPremData?.pm?.inland ?? '';
  const surgePM = rowPremData?.pm?.surge ?? '';
  const tsunamiPM = rowPremData?.pm?.tsunami ?? '';
  const inlandRiskScore = rowPremData?.riskScore?.inland ?? '';
  const surgeRiskScore = rowPremData?.riskScore?.surge ?? '';
  const tsunamiRiskScore = rowPremData?.riskScore?.tsunami ?? '';
  const inlandTechPrem = rowPremData?.premiumData?.techPremium.inland ?? '';
  const surgeTechPrem = rowPremData?.premiumData?.techPremium.surge ?? '';
  const tsunamiTechPrem = rowPremData?.premiumData?.techPremium.tsunami ?? '';
  const subproducerAdj = rowPremData?.premiumData?.subproducerAdj ?? '';

  const provisionalPremium = rowPremData?.premiumData?.provisionalPremium ?? '';
  const premiumSubtotal = rowPremData?.premiumData?.premiumSubtotal;
  const minPremiumAdj = rowPremData?.premiumData?.minPremiumAdj;

  return {
    basementMult,
    inlandHistoryMult,
    surgeHistoryMult,
    tsunamiHistoryMult,
    inlandFFEMult,
    surgeFFEMult,
    tsunamiFFEMult,
    inlandMult,
    surgeMult,
    tsunamiMult,
    inlandStateMult,
    surgeStateMult,
    tsunamiStateMult,
    inlandPM,
    surgePM,
    tsunamiPM,
    inlandRiskScore,
    surgeRiskScore,
    tsunamiRiskScore,
    inlandTechPrem,
    surgeTechPrem,
    tsunamiTechPrem,
    premiumSubtotal,
    minPrem,
    minPremiumAdj,
    provisionalPremium,
    subproducerAdj,
    premium,
    notes: '',
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

export function getSRVars(row: any) {
  let rcvB = row.cov_b_rcv || 0;
  let limitB = row.cov_b_limit || 0;

  return {
    lat: row.latitude,
    lng: row.longitude,
    rcvTotal: row.total_rcv,
    rcvAB: row.cov_a_rcv + rcvB,
    rcvC: row.cov_c_rcv,
    rcvD: row.cov_d_rcv,
    limitAB: row.cov_a_limit + limitB,
    limitC: row.cov_c_limit,
    limitD: row.cov_d_limit,
    deductible: row.deductible,
    numStories: row.num_stories || '1',
    externalRef: row.location_id || 'idemand',
  };
}

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

      if (currChunk !== chunks.length) await waitMilliSeconds(SR_WAIT_MS, 'space out SR API calls');

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

function waitMilliSeconds(ms: number, reason?: string) {
  return new Promise<void>((resolve, reject) => {
    info(`Waiting ${ms} ms ${reason || ''}`, { reason });
    setTimeout(() => {
      resolve();
    }, ms);
  });
}

function getGoogleMapsUrl(
  latitude: number | string | undefined,
  longitude: number | string | undefined
) {
  if (!(latitude && longitude)) return '';
  return `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`;
}

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name; // File path in the bucket.
  const fileName = path.basename(filePath || '');
  info('FILE UPLOAD DETECTED: ', { fileName });
  // TODO: better filtering to only run on wanted uploads & idempotency

  if (shouldReturnEarly(event, PORTFOLIO_UPLOAD_FOLDER, 'text/csv', 'processed')) return;

  // TODO: check metadata for processed status ??
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

  try {
    const stream = fs.createReadStream(tempFilePath);
    const parsed = await parseStreamToArray<IRow, TRow>(
      stream,
      { headers: transformHeadersSnakeCase },
      transformRow,
      validateRow
    );
    const dataArray = parsed.dataArr;
    const invalidRows = parsed.invalidRows;
    // parse downloaded file into array
    // const { dataArray, invalidRows } = await parseStreamToArray(fs.createReadStream(tempFilePath));

    await unlinkFile(tempFilePath);
    info(
      `FINISHED PARSING FILE (${dataArray.length} VALID ROWS - ${invalidRows.length} INVALID ROWS)`
    );

    const ratedArray = await splitAndRate(dataArray);

    await writeToStorage(storageFile, ratedArray, { headers: true });

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

  // doesn't work in dev - "Cannot sign data without client_email"
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
