import type { StorageEvent } from 'firebase-functions/v2/storage';
import { error, info } from 'firebase-functions/logger';
import { getStorage } from 'firebase-admin/storage';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { format, parse } from 'fast-csv';
import { snakeCase, find } from 'lodash';
// // import { featureEach } from '@turf/meta';
// import {
//   FeatureCollection,
//   // point,
//   // booleanPointInPolygon,
//   // polygon,
//   // Position,
//   // Properties,
// } from '@turf/turf';
import { counties20mURL } from '../common';
import {
  countiesJson,
  getCountyFromGeoJson,
  loadCountiesGeoJson,
} from '../firestoreEvents/getSubmissionFIPS';

const PORTFOLIO_UPLOAD_FOLDER = 'portfolio-fips';

export default async (event: StorageEvent) => {
  const fileBucket = event.bucket;
  const filePath = event.data.name;
  const fileName = path.basename(filePath || '');
  const contentType = event.data.contentType;
  const metageneration = event.data.metageneration as unknown;
  console.log('FILE UPLOAD DETECTED: ', fileName);

  if (!event.data.name?.startsWith(`${PORTFOLIO_UPLOAD_FOLDER}/`)) {
    info(
      `Ignoring upload "${event.data.name}" because is not in the "/${PORTFOLIO_UPLOAD_FOLDER}/*" folder.`
    );
    return null;
  }

  if (fileName.startsWith('processed') || fileName.startsWith('sr')) {
    info(`Ignoring upload "${event.data.name}" because it was already processed.`);
    return null;
  }

  console.log('METAGENERATION: ', metageneration, typeof metageneration);
  console.log('CONTENT TYPE: ', contentType);
  console.log('FILE PATH: ', filePath);
  if (metageneration !== '1' || contentType !== 'text/csv' || !filePath) {
    console.log(
      `Ignoring new file. contentType: ${contentType}. metageneration: ${metageneration}. filepath: ${filePath}`
    );
    return null;
  }

  if (!countiesJson) {
    try {
      await loadCountiesGeoJson();
    } catch (err) {
      error(`ERROR GETTING COUNTRY DATA FROM ${counties20mURL.value()}. RETURNING EARLY`);
      return;
    }
  }

  if (countiesJson && countiesJson.features) {
    console.log('COUNTIES JSON 0: ', JSON.stringify(countiesJson.features[0]));
  } else {
    console.log('MISSING COUNTIES JSON');
  }

  const storage = getStorage();
  const bucket = storage.bucket(fileBucket);
  const tempFilePath = path.join(os.tmpdir(), `temp_SR_${fileName}`);

  await bucket.file(filePath).download({ destination: tempFilePath });
  info('File downloaded locally to', tempFilePath);

  const dataArray: any[] = [];

  fs.createReadStream(tempFilePath)
    .pipe(parse({ headers: (headers) => headers.map((h) => snakeCase(h || '')) }))
    .validate((data: any): boolean => {
      return validateRow(data);
    })
    .on('error', (err) => {
      console.error('ERROR PARSING FILE', err);
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
        // get county & fips using counties GeoJson
        await handleParsedGeoJson(dataArray);
      } catch (err) {
        console.log('ERROR: ', err);
      }

      return;
    });

  async function handleParsedGeoJson(data: Record<string, any>[]) {
    // let dataWithCounties = data.map((r) => {
    //   let county_name = '';
    //   let fips = '';
    //   let matchProperties = getCountyFromGeoJson(parseFloat(r.latitude), parseFloat(r.longitude));

    //   if (matchProperties) {
    //     county_name = matchProperties.NAME;
    //     fips = matchProperties.GEOID;
    //   }
    //   return { ...r, county_name, fips };
    // });
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

    return writeToStorage(dataWithCounties, `${fileName}`);
  }

  // function getCountyFromGeoJson(latitude: number, longitude: number) {
  //   let matchProperties: Properties | undefined;
  //   const p = point([longitude, latitude]);

  //   featureEach(countiesJson as FeatureCollection, function (currentFeature, featureIndex) {
  //     if (currentFeature.geometry.type === 'Polygon') {
  //       // let multiPoly = multiPolygon(currentFeature.geometry.coordinates);
  //       let poly = polygon(currentFeature.geometry.coordinates as Position[][]);
  //       if (booleanPointInPolygon(p, poly)) {
  //         matchProperties = currentFeature.properties;
  //       }
  //     }
  //   });
  //   console.log('MATCH PROPERTIES: ', matchProperties);

  //   return matchProperties;
  // }

  async function writeToStorage(data: any[], filename: string) {
    const storageFile = bucket.file(`${PORTFOLIO_UPLOAD_FOLDER}/processed_${filename}`);

    const csvStream = format({ headers: true });

    data.forEach((r) => csvStream.write(r));
    csvStream.end();

    csvStream
      .pipe(storageFile.createWriteStream())
      .on('finish', () => console.log(`FINISHED WRITING TO ${storageFile.name}`));
  }

  return;
};

export function findAddressValueByType(addressObj: any[], addressType: any) {
  return find(addressObj, (o) => {
    return o.types[0] === addressType;
  });
}

function validateRow(data: any) {
  if (!(data.longitude && data.latitude)) {
    console.log(`INVALID ROW - missing latitude or longitude - VALUE: ${JSON.stringify(data)}`);
    return false;
  }
  return true;
}
