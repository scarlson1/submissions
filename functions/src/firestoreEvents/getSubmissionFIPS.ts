import type { FirestoreEvent } from 'firebase-functions/v2/firestore';
import type { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import {
  booleanPointInPolygon,
  FeatureCollection,
  featureEach,
  point,
  polygon,
  Position,
  Properties,
} from '@turf/turf';

import { Submission, FIPS } from '../common';

// import countiesJson from '../assets/counties_20m.json';

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
    console.log('No data associated with event');
    return;
  }
  const submission = snap.data() as Submission;

  try {
    let { state, countyName, coordinates } = submission;

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
      await snap.ref.update({ countyFIPS: fips, countyName: newCountyName });
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

  console.log('SEARCH TERMS: ', countyName, state);
  console.log('COUNTY DETAILS: ', details);

  return `${details.stateFP}${details.countyFP}`;
}

export async function getCountyFromGeoJson(latitude: number, longitude: number) {
  const countiesJson = await require('../assets/counties_20m.json');

  let matchProperties: Properties | undefined;
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
