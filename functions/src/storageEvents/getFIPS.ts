import { File } from '@google-cloud/storage';
import { getStorage } from 'firebase-admin/storage';
import { error, info, warn } from 'firebase-functions/logger';
import type { StorageEvent } from 'firebase-functions/v2/storage';
import fs from 'fs';
import { find } from 'lodash-es';
import { tmpdir } from 'os';
import path from 'path';
import { counties20mURL } from '../common/index.js';
import {
  countiesJson,
  getCountyFromGeoJson,
  loadCountiesGeoJson,
} from '../firestoreEvents/getSubmissionFIPS.js';
import {
  parseStreamToArray,
  shouldReturnEarly,
  transformHeadersSnakeCase,
  writeArrayToStorage as writeToStorage,
} from '../modules/storage/index.js';
import { unlinkFile } from '../utils/storage.js';

type CSVInput = Record<string, string>;
type TCSVInput = Record<string, string> & { latitude: string; longitude: string };

const UPLOAD_FOLDER = 'portfolioFips';

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name;
  const fileName = path.basename(filePath || '');
  info(`FILE UPLOAD DETECTED: ${fileName}`);

  if (shouldReturnEarly(event, UPLOAD_FOLDER, 'text/csv')) return;

  if (!countiesJson) {
    try {
      await loadCountiesGeoJson();
    } catch (err) {
      error(`ERROR GETTING COUNTRY DATA FROM ${counties20mURL.value()}. RETURNING EARLY`);
      return;
    }
  }

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = path.join(tmpdir(), `temp_FIPS_${fileName}`);

  await bucket.file(filePath).download({ destination: tempFilePath });
  info(`File downloaded locally to ${tempFilePath}`);

  let dataArray: any[] = [];

  const stream = fs.createReadStream(tempFilePath);

  try {
    const parsed = await parseStreamToArray<CSVInput, TCSVInput>(
      stream,
      { headers: transformHeadersSnakeCase }, // TODO: use camelCase
      transformRow,
      validateRow
    );

    dataArray = [...parsed.dataArr];
    // invalidRows = [...parsed.invalidRows];

    info(`${parsed.dataArr.length} valid rows and ${parsed.invalidRows.length} invalid rows`);
    if (!dataArray.length) throw new Error('No valid rows');

    await unlinkFile(tempFilePath);
  } catch (err: any) {
    error(`ERROR PARSING CSV. RETURNING EARLY`, { err });

    await unlinkFile(tempFilePath);
    // TODO: report error to sentry or send email to admin
    return;
  }

  try {
    const dataWithCounties = await getCountyData(dataArray);

    const storageFile = bucket.file(`${UPLOAD_FOLDER}/processed_${fileName}`) as unknown as File;

    await writeToStorage(storageFile, dataWithCounties, { headers: true });
    info(`Finished writing fips data to ${storageFile.name}`);
  } catch (err: any) {
    error(`Error getting fips from parsed data`, { err });
    // TODO: clean up storageFile required ??
  }
  return;
};

export function findAddressValueByType(addressObj: any[], addressType: any) {
  return find(addressObj, (o) => {
    return o.types[0] === addressType;
  });
}

function transformRow(data: any) {
  return {
    ...data,
    latitude: data.latitude || '',
    longitude: data.longitude || '',
  };
}

function validateRow(data: any) {
  if (!(data.longitude && data.latitude)) {
    warn(`INVALID ROW - missing latitude or longitude`, { data });
    return false;
  }
  return true;
}

async function getCountyData(data: any[]) {
  let dataWithCounties: any[] = [];
  for (let r of data) {
    let county_name = '';
    let fips = '';
    let matchProperties = await getCountyFromGeoJson(
      parseFloat(r.latitude),
      parseFloat(r.longitude)
    );

    if (matchProperties) {
      county_name = matchProperties.NAME;
      fips = matchProperties.GEOID;
    }
    dataWithCounties.push({ ...r, county_name, fips });
  }

  return dataWithCounties;
}
