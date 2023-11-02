import { File, GetSignedUrlResponse } from '@google-cloud/storage';
import { AxiosInstance, AxiosResponse } from 'axios';
import { addDays } from 'date-fns';
import { getStorage } from 'firebase-admin/storage';
import { error, info } from 'firebase-functions/logger';
import { defineInt, projectID, storageBucket } from 'firebase-functions/params';
import { StorageEvent } from 'firebase-functions/v2/storage';
import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import {
  SRRes,
  ValueByRiskType,
  audience,
  getReportErrorFn,
  printObj,
  sendgridApiKey,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common/index.js';
import { extractSRAALs } from '../modules/rating/getAALs.js';
import { getPremium } from '../modules/rating/index.js';
import { swissReBody } from '../modules/rating/swissReBody.js';
import {
  parseStreamToArray,
  shouldReturnEarly,
  transformHeadersSnakeCase,
  writeArrayToStorage as writeToStorage,
} from '../modules/storage/index.js';
import { generateSRAccessToken, getSwissReInstance } from '../services/index.js';
import { sendMessage } from '../services/sendgrid/index.js';
import { randomFileName, splitChunks, unlinkFile, waitMilliSeconds } from '../utils/index.js';
import { IRow, TRow } from './models/index.js';
import {
  FlattenedPremData,
  flattenPremData,
  getPremCalcVars,
  getSRVars,
  transformRatePortfolioRow,
} from './transform/index.js';
import { validateRatePortfolioRow } from './validation/ratePortfolio.js';

const reportErr = getReportErrorFn('ratePortfolio');

let swissReInstance: AxiosInstance;
let swissReInstanceTimestamp: number; // TODO: regenerate if > 10 mins
const tenMins = 60 * 1000 * 10;

const chunkCount = defineInt('SR_CHUNK_COUNT');
const PORTFOLIO_UPLOAD_FOLDER = 'ratePortfolio';
const SR_WAIT_MS = 30000;

interface TRowWithAAL extends TRow, AALsWithErrMsg {}

// interface CalcPremResult extends TRowWithAAL, FlattenedPremData {}
type CalcPremResult = TRowWithAAL & FlattenedPremData;

const calcPrem = (data: TRowWithAAL[]) => {
  const result: CalcPremResult[] = [];

  for (let r of data) {
    try {
      console.log('r: ');
      printObj(r);
      if (r.inland === -1) {
        let msg = r.skip ? 'skip row' : r.errMsg || 'missing aals';
        throw new Error(msg);
      }
      const getPremProps = getPremCalcVars(r);
      console.log('prem props: ');
      printObj(getPremProps);
      const rowPremData = getPremium({ ...getPremProps, isPortfolio: true });
      console.log('rowPremData: ');
      printObj(rowPremData);
      const flattenedPremData = flattenPremData(rowPremData);
      console.log('flattened: ');
      printObj(flattenedPremData);

      result.push({
        ...r,
        ...flattenedPremData,
      });
    } catch (err: any) {
      const errMsg = err?.message || null;
      if (errMsg !== 'skip row')
        error(`ERROR (location: ${r.location_id || r.address_1 || '"no address_1"'}): `, {
          errMsg,
        });

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
        techPremTotal: '',
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

function getSRPromise(data: TRow): Promise<AxiosResponse<SRRes, any>> {
  if (data.skip) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        reject(new Error('skip row'));
      }, 50);
    });
  }
  if (!swissReInstance) throw Error('SwissReInstance undefined');
  const xmlBodyVars = getSRVars(data);
  info(`SR XML VARIABLES (${data.location_id || ''})`, { ...xmlBodyVars });
  const body = swissReBody(xmlBodyVars);

  return swissReInstance.post<SRRes>('/rate/sync/srxplus/losses', body, {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
  });
}

interface AALsWithErrMsg extends ValueByRiskType {
  errMsg: string;
}
interface GetAALsRes extends TRow, AALsWithErrMsg {}

/** fetch AALs for an array of rows (Promise.all)
 * @param {TRow[]} parsedData chunk of rows
 * @returns {Promise<GetAALsRes[]>} promise which resolves to the parsed data array with AALs appended to each item (inland, surge, tsunami, errMsg) aals -1 if error
 */
async function getAALs(parsedData: TRow[]): Promise<GetAALsRes[]> {
  try {
    // Catch error so promise.all doesn't cause all requests to fail
    const promises = parsedData.map((r, i) =>
      getSRPromise(r).catch((err: any) => {
        let errMsg = 'Error fetching AALs from Swiss Re.';
        if (err?.message && typeof err.message === 'string') errMsg = err.message;
        if (err?.response?.data) errMsg += ` ${[JSON.stringify(err.response.data)]}`;

        error(`Error fetching AALs for row index ${i}`, {
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
      | AxiosResponse<SRRes, any>
      | {
          data: {
            errMsg: string;
          };
        }
    >[];

    const results = await Promise.all(promises);

    // Map results -> get errMsg, inland, surge, tsunami AALs (-1 if error)
    const aals: AALsWithErrMsg[] = results.map((r) => ({
      // @ts-ignore
      ...extractSRAALs(r?.data?.expectedLosses || undefined), // @ts-ignore
      errMsg: (r?.data?.errMsg as unknown as string) || '',
    }));

    // Append AALs and errMsg to each row
    return parsedData.map((r, i) => ({ ...r, ...aals[i] }));
  } catch (err: any) {
    error('AALs ERR: ', { ...err });
    throw err;
  }
}

/** fetch AALs for array of rows, then calc premium on rows without errors
 * @param {TRow[]} chunk array of rows containing data required for Swiss Re AALs api call
 * @returns {object} ratedChunk and errorRows
 */
async function getPremiumForChunk(chunk: TRow[]) {
  const chunkWithAAL = await getAALs(chunk);
  // info(`FINISHED FETCHING AALs FOR CHUNK (COUNT: ${currChunk})`, { ...chunkWithAAL });

  const filtered = chunkWithAAL.filter((row) => row.inland !== -1);
  const errorRows = chunkWithAAL.filter((row) => row.inland === -1);

  const ratedChunk = calcPrem(filtered);

  return { ratedChunk, errorRows };
}

/** split rows into chunks of X size, then fetch AALs and calculate premium for each chunk
 * @param {TRow[]} data array of data to be split into array of X size (X = env var "chunkCount"), then loop through each chunk to get AALs and calc premium
 * @returns {(CalcPremResult | GetAALsRes)[]} 1 dimensional array rows with original data, aals, and premium calc details
 */
async function splitAndRate(data: TRow[]) {
  let ratedArray: (CalcPremResult | GetAALsRes)[] = [];
  let chunkSize = chunkCount.value() || 100;
  let chunks: TRow[][] = data.length > chunkSize ? splitChunks(data, chunkSize) : [data];
  // Add an extra array for retries
  chunks.push([]);
  let currChunk = 1;

  for (let chunk of chunks) {
    // retry array might be empty
    if (chunk.length) {
      const { ratedChunk, errorRows } = await getPremiumForChunk(chunk);
      printObj(ratedChunk);
      printObj(errorRows);

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
  const tempFilePath = path.join(tmpdir(), randomFileName(filePath));

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
      transformRatePortfolioRow,
      validateRatePortfolioRow
    );
    const dataArray = parsed.dataArr;
    const invalidRows = parsed.invalidRows;

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
    reportErr(`Error handling portfolio rating (${fileName})`, { fileName }, err);
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

  await sendMessage(sgKey, to, msgBody, 'Portfolio rating complete', undefined, {
    customArgs: {
      emailType: 'portfolio_rating_complete',
    },
  });
}
