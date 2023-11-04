import {
  FeatureCollection,
  Position,
  Properties,
  booleanPointInPolygon,
  featureEach,
  point,
  polygon, // @ts-ignore (type error)
} from '@turf/turf';
import axios from 'axios';
import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { error, info, warn } from 'firebase-functions/logger';
import type { FirestoreEvent } from 'firebase-functions/v2/firestore';

import { FIPS, Submission, counties20mURL } from '../common/index.js';

export let countiesJson: FeatureCollection | undefined;

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      submissionId: string;
    }
  >
) => {
  const snap = event.data;
  if (!snap) {
    warn('No data associated with event');
    return;
  }
  const submission = snap.data() as Submission;

  if (!countiesJson) {
    try {
      await loadCountiesGeoJson();
    } catch (err) {
      error(`ERROR GETTING COUNTRY DATA FROM ${counties20mURL.value()}. RETURNING EARLY`);
      return;
    }
  }

  try {
    const { address, coordinates } = submission;
    const { state, countyName } = address;

    let fips;
    let newCountyName = countyName;
    if (state && countyName) {
      fips = getFIPS(countyName, state);
    }

    if (!fips && coordinates && coordinates.latitude && coordinates.longitude) {
      const matchProperties = await getCountyFromGeoJson(
        coordinates.latitude,
        coordinates.longitude
      );
      if (matchProperties) {
        fips = matchProperties.GEOID;
        if (!countyName) newCountyName = matchProperties.NAME;
      }
    }

    if (fips) {
      await snap.ref.update({
        countyFIPS: fips, // TODO: remove once converted to new types (property of address)
        countyName: newCountyName,
        'address.countyFIPS': fips,
        'address.countyName': newCountyName || '',
        'metadata.updated': Timestamp.now(),
      });
      console.log(`UPDATED SUBMISSION ${snap.id} FIPS TO ${fips}`);
    }
  } catch (err) {
    console.log(`ERROR GETTING FIPS FOR SUBMISSION ${snap.id}`);
  }

  return {};
};

export function getFIPS(countyName: string, state: string) {
  if (!countyName || !state) return '';

  const details = FIPS.find(
    (e) =>
      e.state === state &&
      e.countyName.toLowerCase().includes(countyName.split(' ')[0].toLowerCase())
  );
  if (!details) return '';

  info('COUNTY SEARCH TERMS: ', { countyName, state });
  info('COUNTY DETAILS: ', { details });

  return `${details.stateFP}${details.countyFP}`;
}

export async function getCountyFromGeoJson(latitude: number, longitude: number) {
  if (!countiesJson) throw new Error('Missing counties JSON');

  let matchProperties: Properties | undefined;
  const p = point([longitude, latitude]);

  featureEach(
    countiesJson as FeatureCollection,
    function (currentFeature: any, featureIndex: number) {
      // Feature<any>
      if (currentFeature.geometry.type === 'Polygon') {
        // let multiPoly = multiPolygon(currentFeature.geometry.coordinates);
        let poly = polygon(currentFeature.geometry.coordinates as Position[][]);
        if (booleanPointInPolygon(p, poly)) {
          matchProperties = currentFeature.properties;
        }
      }
    }
  );
  info('COUNTIES JSON MATCH PROPERTIES: ', { matchProperties });

  return matchProperties;
}

export async function loadCountiesGeoJson() {
  info(`Loading county GeoJSON from ${counties20mURL.value()}`);
  const { data } = await axios.get(counties20mURL.value());
  if (!data) throw new Error(`Missing county data from ${counties20mURL.value()}`);

  countiesJson = data;
}
