import * as functions from 'firebase-functions';
import { getStorage } from 'firebase-admin/storage';
import { defineSecret } from 'firebase-functions/params';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { format, parse } from 'fast-csv';
import { snakeCase, find } from 'lodash';
import axios from 'axios';
import { featureEach } from '@turf/meta';
import { FeatureCollection, point, booleanPointInPolygon, polygon, Position } from '@turf/turf';

//  addressObj: AddressComponent[],
// addressType: AddressComponentType

import { FIPS } from '../common/fips';
import countiesJson from '../assets/counties_20m.json';

const googleGeoKey = defineSecret('GOOGLE_BACKEND_GEO_KEY');

export const findAddressValueByType = (addressObj: any[], addressType: any) => {
  return find(addressObj, (o) => {
    return o.types[0] === addressType;
  });
};

const PORTFOLIO_UPLOAD_FOLDER = 'temp';

export const tempGetFIPS = functions
  .runWith({ secrets: [googleGeoKey] })
  .storage.object()
  .onFinalize(async (object) => {
    const fileBucket = object.bucket;
    const filePath = object.name; // File path in the bucket.
    const fileName = path.basename(filePath || '');
    const contentType = object.contentType;
    const metageneration = object.metageneration;
    console.log('FILE UPLOAD DETECTED: ', fileName);

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

    const googleGeoKey = process.env.GOOGLE_BACKEND_GEO_KEY;
    if (!googleGeoKey) throw new Error('missing google api key');

    const storage = getStorage();
    const bucket = storage.bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), `temp_SR_${fileName}`);

    await bucket.file(filePath).download({ destination: tempFilePath });
    functions.logger.log('File downloaded locally to', tempFilePath);

    const dataArray: any[] = [];

    fs.createReadStream(tempFilePath)
      .pipe(parse({ headers: (headers) => headers.map((h) => snakeCase(h || '')) }))
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
          await handleParsed(dataArray);
          await handleParsed2(dataArray);
        } catch (err) {
          console.log('ERROR: ', err);
        }

        return;
      });

    // async function reverseGeocodeForCounty(latitude: string | number, longitude: string | number) {
    //   try {
    //     const googleGeoKey = process.env.GOOGLE_BACKEND_GEO_KEY;
    //     if (!googleGeoKey) throw new Error('missing google api key')

    //     const { data } = await axios.get(
    //       `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=street_address&key=${googleGeoKey}`
    //     );
    //     console.log('GEOCODE RES: ', data);
    //     const { address_components } = data.results[0];

    //     const newCounty = findAddressValueByType(address_components, 'administrative_area_level_2');

    //     return `${newCounty?.long_name || ''}`;
    //   } catch (err) {
    //     return ''
    //   }
    // }

    async function handleParsed(data: any[]) {
      try {
        let counties = await getCountyNames(data);

        if (data.length !== counties.length) {
          console.log('COUNTY COUNT NOT THE SAME AS ROW COUNT - RETURNING EARLY');
          throw new Error(
            'County count not same as row count. Cannot merge without risk if data mismatch'
          );
        }

        let merged = data.map((r, i) => {
          const countyName = counties[i];

          const fips = getFIPS(countyName, r.state);
          console.log('FIPS: ', fips);

          return { ...r, countyName, fips };
        });

        return writeToStorage(merged, fileName);
      } catch (err) {
        throw err;
      }
    }

    function handleParsed2(data: any[]) {
      let dataWithCounties = data.map((r) => {
        let countyName = '';
        let fips = '';
        let matchProperties = getCountyFromGeoJson(parseFloat(r.latitude), parseFloat(r.longitude));
        console.log('RETURNED MATCH PROPERTIES: ', matchProperties);

        if (matchProperties) {
          // @ts-ignore
          countyName = matchProperties.NAME; // @ts-ignore
          fips = matchProperties.GEOID;
        }
        console.log('COUNTY NAME: ', countyName);
        console.log('FIPS 2: ', fips);
        return { ...r, countyName, fips };
      });

      return writeToStorage(dataWithCounties, `GEOJSON_${fileName}`);
    }

    async function getCountyNames(data: any[]) {
      let promises: any[] = [];
      // data.forEach((r) => promises.push(getReverseGeocodePromise(r.latitude, r.longitude)));
      data.forEach((r) => promises.push(getReverseGeocodePromise2(r.zip)));

      let results = await Promise.all(promises);
      results.forEach((result) => console.log('DATA: ', result.data));

      let counties = results.map((r) => {
        // TODO: fall back to geojson if not found ??
        if (!r.data?.results[0]) return '';
        // const { components } = r.data?.results[0];

        // console.log('COMPONENTS: ', components);
        // return components?.county || '';
        const { address_components } = r.data?.results[0];

        const newCounty = findAddressValueByType(address_components, 'administrative_area_level_2');

        console.log('ADDRESS COMPONENTS: ', JSON.stringify(address_components));
        console.log('COUNTY COMPONENT: ', newCounty);

        return `${newCounty?.long_name || ''}`;
      });

      return counties;
    }

    // function getReverseGeocodePromise(latitude: string | number, longitude: string | number) {
    //   // return axios.get(
    //   //   `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=6409eb7a23824de682e6244cbe0d042b`
    //   // );
    //   return axios.get(
    //     `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&result_type=administrative_area_level_2&key=${googleGeoKey}`
    //   );
    //   // &result_type=street_address
    // }
    function getReverseGeocodePromise2(postal: string) {
      return axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${postal}&result_type=administrative_area_level_2&key=${googleGeoKey}`
      );
    }

    function getFIPS(countyName: string, state: string) {
      if (!countyName || !state) return '';
      // const details = FIPS.find((e) => `${e.stateFP}${e.countyFP}` === fips);
      const details = FIPS.find((e) => e.state === state && e.countyName.includes(countyName));
      if (!details) return '';
      console.log('SEARCH TERMS: ', countyName, state);
      console.log('COUNTY DETAILS: ', details);
      return `${details.stateFP}${details.countyFP}`;
    }

    function getCountyFromGeoJson(latitude: number, longitude: number) {
      let matchProperties;
      const p = point([longitude, latitude]);

      featureEach(countiesJson as FeatureCollection, function (currentFeature, featureIndex) {
        if (currentFeature.geometry.type === 'Polygon') {
          // let multiPoly = multiPolygon(currentFeature.geometry.coordinates);
          let poly = polygon(currentFeature.geometry.coordinates as Position[][]);
          if (booleanPointInPolygon(p, poly)) {
            matchProperties = currentFeature.properties;
          }
        }
      });
      console.log('MATCH PROPERTIES: ', matchProperties);

      return matchProperties;
    }

    async function writeToStorage(data: any[], filename: string) {
      const storageFile = bucket.file(`${PORTFOLIO_UPLOAD_FOLDER}-processed/processed_${filename}`);

      const csvStream = format({ headers: true });

      data.forEach((r) => csvStream.write(r));
      csvStream.end();

      csvStream
        .pipe(storageFile.createWriteStream())
        .on('finish', () => console.log(`FINISHED WRITING TO ${storageFile.name}`));
    }

    return;
  });
