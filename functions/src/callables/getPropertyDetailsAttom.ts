import axios from 'axios';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { ceil, max, round, sum } from 'lodash-es';

import type { Address, Coords, Nullable } from '@idemand/common';
import {
  attomKey as attomKeySecret,
  audience,
  elevationKey,
  googleGeoKey,
  LimitTypes,
  maxA,
  minA,
  propertyDataResCollection,
} from '../common/index.js';
import { getAttomProperty } from '../services/attom.js';
import {
  geocodeAddress,
  getElevation,
  getFEMAFloodZone,
} from '../services/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { isValidCoords } from '../utils/validateCoords.js';
import { validate } from './utils/index.js';

function getMockAttomData() {
  return axios
    .get('https://scarlson1.github.io/data/attom.json')
    .then(({ data }) => data);
}

let defaultLimitPercents: { [key in LimitTypes]: number } = {
  limitA: 1,
  limitB: 0.05,
  limitC: 0.25,
  limitD: 0.1,
};

interface InitLimits {
  initLimitA: number;
  initLimitB: number;
  initLimitC: number;
  initLimitD: number;
}

export interface GetPropertyDetailsAttomRequest extends Address {
  coordinates?: Nullable<Coords> | null | undefined;
}

const getPropertyDetailsAttom = async ({
  data,
}: CallableRequest<GetPropertyDetailsAttomRequest>) => {
  info('data: ', data);
  let {
    addressLine1,
    addressLine2 = '',
    city,
    state,
    postal = '',
    coordinates,
  } = data;
  validate(
    addressLine1 && city && state,
    'failed-precondition',
    'Missing address components in request body',
  );

  let basicProfileRes;
  let profile;
  let propertyDetails;
  let elevationData: Awaited<ReturnType<typeof getElevation>> | null = null;

  try {
    if (audience.value() === 'LOCAL HUMANS') {
      info('USING MOCK RESPONSE FROM GITHUB');
      basicProfileRes = await getMockAttomData();
      profile =
        basicProfileRes?.property && basicProfileRes.property.length > 0
          ? basicProfileRes.property[0]
          : null;
    } else {
      let { data: basicRes, profile: extractedProfile } =
        await getAttomProperty(attomKeySecret.value(), {
          addressLine1,
          addressLine2,
          city,
          state,
          postal,
        });
      basicProfileRes = basicRes;
      profile = extractedProfile;
      info('BASIC PROFILE: ', { profile });
    }
  } catch (err) {
    throw new HttpsError('internal', `Error fetching property data`);
  }

  // set coordinates from property data res (if not provided)
  if (!isValidCoords(coordinates)) {
    let latitude = profile?.location?.latitude
      ? Number(profile?.location?.latitude)
      : null;
    let longitude = profile?.location?.longitude
      ? Number(profile?.location?.longitude)
      : null;
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      coordinates = {
        latitude,
        longitude,
      };
    }
  }

  if (!isValidCoords(coordinates)) {
    try {
      info('geocoding address...', data);
      const geocodeResult = await geocodeAddress(googleGeoKey.value(), {
        addressLine1,
        city,
        state,
        postal,
      });
      coordinates = geocodeResult.coordinates;
    } catch (err: any) {
      error('Error fetching flood zone: ', { err });
    }
  }

  let floodZone = '';
  if (isValidCoords(coordinates)) {
    try {
      console.log('fetching flood zone and elevation...');
      const [fzRes, elevationRes] = await Promise.all([
        getFEMAFloodZone(coordinates),
        getElevation(elevationKey.value(), coordinates),
      ]);
      info(`flood zone and elevation res: `, { fzRes, elevationRes });
      if (fzRes) floodZone = fzRes;
      elevationData = elevationRes;
    } catch (err: any) {
      error('Error fetching flood zone: ', { err });
    }
  }

  if (profile) {
    const fallback: {
      [key: string]: number | string | null | Nullable<Coords>;
    } = {
      initLimitA: null,
      initLimitB: null,
      initLimitC: null,
      initLimitD: null,
      initDeductible: null,
      maxDeductible: 200000,
      attomDocId: null,
      coordinates: {
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null,
      },
    };
    let attomDocRef;

    try {
      const propertyDataCol = propertyDataResCollection(getFirestore());
      attomDocRef = await propertyDataCol.add({
        basicProfileResponse: basicProfileRes,
        profile: profile || null,
        detailsRes: propertyDetails || null,
        attomId: profile.identifier.attomId || null,
        elevationData,
        metadata: {
          created: Timestamp.now(),
        },
      });
      info(`Attom data saved to doc: ${attomDocRef.id}`);
      fallback.attomDocId = attomDocRef.id;
    } catch (err) {
      info('Error saving Attom data to Firestore', err);
    }

    try {
      let attomRatingData = extractRatingDataAttom(
        profile,
        state,
        floodZone,
        elevationData?.elevation,
      );
      let { replacementCost } = attomRatingData;
      info('Attom rating data: ', { ...attomRatingData });

      if (!replacementCost) return { ...attomRatingData, ...fallback };

      let res: any;

      try {
        let MAX_A = maxA.value();
        let MIN_A = minA.value();

        let limitARef = ceil(
          Math.min(Math.max(replacementCost, MIN_A), MAX_A),
          -3,
        );

        let defaults: InitLimits = {
          initLimitA: limitARef,
          initLimitB: ceil(limitARef * defaultLimitPercents['limitB'], -3),
          initLimitC: ceil(limitARef * defaultLimitPercents['limitC'], -3),
          initLimitD: ceil(limitARef * defaultLimitPercents['limitD'], -3),
        };

        res = { ...defaults, attomDocId: attomDocRef?.id ?? null };
        const sumCoverage = sum(Object.values(defaults));
        res.initDeductible = ceil(sumCoverage * 0.01, -3);
        res.maxDeductible = ceil(sumCoverage * 0.2, -3);

        info('GET PROPERTY DETAILS ATTOM RES: ', { ...res });

        return {
          ...attomRatingData,
          ...res,
          coordinates: {
            latitude: coordinates?.latitude || null,
            longitude: coordinates?.longitude || null,
          },
          elevationData,
        };
      } catch (err: any) {
        error(
          'ERROR CALCULATING DEFAULT LIMITS/DEDUCTIBLE. USING FALLBACK NFIP. ERROR: ',
          {
            stack: err?.stack || null,
            message: err?.message || null,
            code: err?.code || null,
          },
        );

        return { ...attomRatingData, ...fallback, elevationData };
      }
    } catch (err) {
      console.log(
        'ERROR VALIDATING SPATIAL KEY RESPONSE. USING FALLBACK NFIP. ERROR: ',
        err,
      );

      return { ...fallback };
    }
  } else {
    throw new HttpsError('internal', `Error fetching property data`);
  }
};

export default onCallWrapper<GetPropertyDetailsAttomRequest>(
  'getpropertydetailsattom',
  getPropertyDetailsAttom,
);

interface AttomBasicProfile {
  [key: string]: any;
}

function extractRatingDataAttom(
  attomData: AttomBasicProfile,
  state: string,
  fz?: string,
  elevation?: number | null,
) {
  const { summary, building, assessment } = attomData;

  let sqFootage = building?.size?.livingSize || null;
  let numStories = summary?.levels || 1; // (should default to 1 at later stage ??);
  let replacementCost = tempCalcRCV(assessment);
  let propertyCode = summary?.propType || null;
  let yearBuilt = summary?.yearBuilt || null; // TODO: worth calling details endpoint for effective year built ??
  let floodZone = fz || ''; // attomData.us_hh_fema_all_params_zone;
  let CBRSDesignation = ''; // attomData.us_hh_fema_cbrs_params_designation;
  let basement = building?.interior?.bsmtType?.toLowerCase() || 'unknown'; // TODO: basement res types
  let distToCoastFeet = 1000000;

  const rcvBySqFootage = sqFootage
    ? calcRCVBySquareFootage(sqFootage, state)
    : null;

  if (rcvBySqFootage && replacementCost)
    replacementCost = max([rcvBySqFootage, replacementCost]) || null;

  // const bsmtSize = building?.interior?.bsmtSize ? building?.interior?.bsmtSize : null;
  // if (basement !== null && bsmtSize && bsmtSize > 0 && typeof numStories === 'number') numStories++;
  // if (basement === '') basement = 'unknown';

  return {
    sqFootage,
    numStories,
    distToCoastFeet,
    replacementCost,
    propertyCode,
    yearBuilt,
    floodZone,
    CBRSDesignation,
    basement,
    elevation: elevation || null,
  };
}

// TODO: use greater of above and sq ft calc
// TODO: use livingSize * 150

function tempCalcRCV(assessment: any) {
  if (!assessment) return null;
  const { market, assessed } = assessment;

  // if no market values, try assessed total value (land & building)
  if (!market) {
    if (assessed && assessed.assdTtlValue)
      return round(assessed.assdTtlValue, -3);
    return null;
  }

  const { mktImprValue, mktTtlValue } = market; // mktLandValue,

  if (mktImprValue && mktTtlValue) {
    const improvedToTotalRatio = mktImprValue / mktTtlValue;
    if (improvedToTotalRatio < 0.4) return round(mktTtlValue * 0.6, -3);
  }

  if (mktImprValue) return round(market.mktImprValue, -3);

  return null;
}

const sqFootageFactor: Record<string, number> = {
  FL: 150,
};

function calcRCVBySquareFootage(sqFootage: number, state: string) {
  const factor = sqFootageFactor[state] || 150;
  return round(factor * sqFootage, -3);
}

// const sampleRentCastRes = [
//   {
//     addressLine1: '1382 Hunter Dr',
//     city: 'Wayzata',
//     state: 'MN',
//     zipCode: '55391',
//     formattedAddress: '1382 Hunter Dr, Wayzata, MN 55391',
//     bedrooms: 5,
//     squareFootage: 3299,
//     yearBuilt: 1960,
//     county: 'Hennepin',
//     assessorID: '25-118-23-13-0009',
//     legalDescription: '002 001 HUNTER RIDGE FARM IRREGULAR',
//     subdivision: 'HUNTER RIDGE FARM',
//     ownerOccupied: true,
//     bathrooms: 4,
//     lotSize: 326700,
//     propertyType: 'Single Family',
//     lastSalePrice: 1900000,
//     lastSaleDate: '2020-09-25T00:00:00.000Z',
//     features: {
//       architectureType: 'Ranch',
//       cooling: true,
//       coolingType: 'Package',
//       exteriorType: 'Wood',
//       fireplace: true,
//       floorCount: 1,
//       foundationType: 'Block',
//       garage: true,
//       garageType: 'Attached',
//       heating: true,
//       heatingType: 'Floor / Wall',
//       roofType: 'Wood',
//       roomCount: 10,
//       unitCount: 1,
//     },
//     taxAssessments: { '2022': { value: 2142000, land: 1134000, improvements: 1008000 } },
//     propertyTaxes: { '2023': { total: 25214 } },
//     owner: {
//       names: ['MARKUS SPECKS', 'SAMANTHA SPECKS', 'COLIN J LUNDGREN', 'WENDY LUNDGREN'],
//       mailingAddress: {
//         id: '1382-Hunter-Dr,-Wayzata,-MN-55391',
//         addressLine1: '1382 Hunter Dr',
//         city: 'Wayzata',
//         state: 'MN',
//         zipCode: '55391',
//       },
//     },
//     id: '1382-Hunter-Dr,-Wayzata,-MN-55391',
//     longitude: -93.52893,
//     latitude: 45.003343,
//   },
// ];
