import { StorageEvent } from 'firebase-functions/v2/storage';
import { info, warn, error } from 'firebase-functions/logger';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { format, parse } from 'fast-csv';
import { snakeCase } from 'lodash';
import { AxiosInstance, AxiosResponse } from 'axios';

import { getNumber, swissReClientId, swissReClientSecret, swissReSubscriptionKey } from '../common';
import { generateSRAccessToken, getSwissReInstance } from '../services';
import { swissReBody } from '../utils/rating/swissReBody.js';
import { getPremium } from '../utils/rating';

let swissReInstance: AxiosInstance;

const PORTFOLIO_UPLOAD_FOLDER = 'portfolio-aal-and-rate';

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name; // File path in the bucket.
  const fileName = path.basename(filePath || '');
  const contentType = event.data.contentType;
  const metageneration = event.data.metageneration as unknown;
  info('FILE UPLOAD DETECTED: ', fileName);
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
    info(
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
      // TODO: add floodzone, etc. to validation
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
        await getAALs(dataArray);

        await bucket.file(filePath).setMetadata({ metadata: { status: 'processed' } });
      } catch (err) {
        await bucket.file(filePath).setMetadata({ metadata: { status: 'error' } });
      }

      return;
    });

  function getSRPromise(data: any) {
    const xmlBodyVars = getSRVars(data);
    info('BODY VARS => ', xmlBodyVars);
    const body = swissReBody(xmlBodyVars);

    // TODO: type response
    return swissReInstance.post<any, AxiosResponse<any, any>>('/rate/sync/srxplus/losses', body, {
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
      // TODO: catch errors - https://codehandbook.org/how-to-handle-error-in-javascript-promise-all/
      const promises = parsedData.map(
        (r) => getSRPromise(r)
        // .catch((err: any) => {
        //   let errMsg = 'Error fetching alls from Swiss Re.';
        //   // if (err.data.message) errMsg = err.response
        //   return {
        //     data: undefined,
        //     errMsg,
        //   };
        // })
      );

      let results = await Promise.all(promises);
      // results.forEach((result) => info('DATA: ', result?.data));
      let aals = results.map((r) =>
        r?.data?.expectedLosses
          ? extractAAL(r?.data?.expectedLosses)
          : { inlandAAL: 0, surgeAAL: 0 }
      ); // TODO: decide what to return instead of 0 ??
      // let errs = results.map(r => r.errMsg)

      info('AALs: ', aals);

      if (parsedData.length !== aals.length) {
        info('AAL COUNT NOT THE SAME AS ROW COUNT - RETURNING EARLY');
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
        } catch (err) {
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

      // return writeToStorage(merged);
      info(`INVALID ROWS (COUNT: ${invalidRows.length}): `, invalidRows);
      return writeToStorage(result);
    } catch (err: any) {
      info('ERR: ', err);
      info('ERROR: ', err?.response?.data);
      throw err;
    }
  }

  // const storage = new Storage();
  const storageFile = bucket.file(`${PORTFOLIO_UPLOAD_FOLDER}/processed_${fileName}`); // .csv

  async function writeToStorage(data: any[]) {
    const csvStream = format({ headers: true });

    data.forEach((r) => csvStream.write(r));
    csvStream.end();

    csvStream
      .pipe(storageFile.createWriteStream())
      .on('finish', () => info(`FINISHED WRITING TO ${storageFile.name}`));
  }

  return;
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

export function getPremCalcVars(row: any) {
  return {
    inlandAAL: row.inlandAAL,
    surgeAAL: row.surgeAAL,
    limitA: row.cov_a_limit,
    limitB: row.cov_b_limit,
    limitC: row.cov_c_limit,
    limitD: row.cov_d_limit,
    floodZone: row.flood_zone,
    state: row.state,
    basement: row.basement,
    priorLossCount: row.prior_loss_count || '0',
    commissionPct: row.commission_pct || 0.15,
  };
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

export function formatPremData(rowPremData: any) {
  let premium = rowPremData?.premiumData?.directWrittenPremium ?? '';
  let minPrem = rowPremData?.minPremium ?? '';
  let inlandMult = rowPremData?.secondaryFactorMults?.inland ?? '';
  let surgeMult = rowPremData?.secondaryFactorMults?.surge ?? '';
  let basementMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.basementMult ?? '';
  let inlandHistoryMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.historyMult?.inland ?? '';
  let surgeHistoryMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.historyMult?.surge ?? '';
  let inlandFFEMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.ffeMult.inland ?? '';
  let surgeFFEMult =
    rowPremData?.secondaryFactorMults?.secondaryFactorMultsByFactor?.ffeMult.surge ?? '';
  let inlandStateMult = rowPremData?.stateMultipliers?.inland ?? '';
  let surgeStateMult = rowPremData?.stateMultipliers?.surge ?? '';
  let inlandPM = rowPremData?.pm?.inland ?? '';
  let surgePM = rowPremData?.pm?.surge ?? '';
  let inlandRiskScore = rowPremData?.riskScore?.inland ?? '';
  let surgeRiskScore = rowPremData?.riskScore?.surge ?? '';
  let inlandTechPrem = rowPremData?.premiumData?.techPremium.inland ?? '';
  let surgeTechPrem = rowPremData?.premiumData?.techPremium.surge ?? '';
  let subproducerAdj = rowPremData?.premiumData?.subproducerAdj ?? '';

  let provisionalPremium = rowPremData?.premiumData?.provisionalPremium ?? '';
  let premiumSubtotal = rowPremData?.premiumData?.premiumSubtotal;
  let minPremiumAdj = rowPremData?.premiumData?.minPremiumAdj;

  return {
    basementMult,
    inlandHistoryMult,
    surgeHistoryMult,
    inlandFFEMult,
    surgeFFEMult,
    inlandMult,
    surgeMult,
    inlandStateMult,
    surgeStateMult,
    inlandPM,
    surgePM,
    inlandRiskScore,
    surgeRiskScore,
    inlandTechPrem,
    surgeTechPrem,
    premiumSubtotal,
    minPrem,
    minPremiumAdj,
    provisionalPremium,
    subproducerAdj,
    premium,
    notes: '',
  };
}
