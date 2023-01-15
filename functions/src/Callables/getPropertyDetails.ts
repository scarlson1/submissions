import * as functions from 'firebase-functions';
import 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
// import invariant from 'tiny-invariant';

import { SpatialKeyResponse, UWNote } from '../common/types';
import { getSpatialKeyInstance } from '../services';
import { AxiosResponse } from 'axios';

// The latitude must be a number between -90 and 90 and the longitude between -180 and 180.
const isLongitude = (num: number) => isFinite(num) && Math.abs(num) <= 180;
const isLatitude = (num: number) => isFinite(num) && Math.abs(num) <= 90;
const isLatLng = (lat: number, lng: number) => {
  return isLatitude(lat) && isLongitude(lng);
};

const spatialKeyUserKey = defineSecret('SPATIALKEY_USER_API_KEY');
const spatialKeyOrgKey = defineSecret('SPATIALKEY_ORG_API_KEY');
const spatialKeySecretKey = defineSecret('SPATIALKEY_ORG_SECRET_KEY');

export const getPropertyDetails = functions
  .runWith({ secrets: [spatialKeyUserKey, spatialKeyOrgKey, spatialKeySecretKey] })
  .https.onCall(async (data) => {
    console.log('data: ', data);
    const { lat, lng } = data;
    if (!lat || !lng || !isLatLng(lat, lng)) {
      throw new functions.https.HttpsError('invalid-argument', `Invalid coordinates`);
    }

    const spatialKeyInstance = getSpatialKeyInstance({
      userApiKey: process.env.SPATIALKEY_USER_API_KEY!,
      orgApiKey: process.env.SPATIALKEY_ORG_API_KEY!,
      orgSecretKey: process.env.SPATIALKEY_ORG_SECRET_KEY!,
    });

    let spatialKeyData;
    try {
      let { data: propResData }: AxiosResponse<SpatialKeyResponse[]> = await spatialKeyInstance.get(
        `/api/analytics/v3/uw/single.json?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(
          lng
        )}&shortFieldNames=true`
      );
      spatialKeyData = propResData[0];
    } catch (err) {
      throw new functions.https.HttpsError('internal', `Error fetching property data`);
    }

    if (spatialKeyData) {
      let validatedRatingData = await validateSpatialKeyRes(spatialKeyData!);
      // TODO: set

      return validatedRatingData;
    } else {
      throw new functions.https.HttpsError('internal', `Error fetching property data`);
    }
  });

async function validateSpatialKeyRes(spatialKeyData: SpatialKeyResponse) {
  let requiresReview = false;
  let propertyNotes: UWNote[] = [];

  let sqFootage = parseFloat(spatialKeyData.us_hh_square_footage);
  let numStories = parseInt(spatialKeyData.us_hh_assessment_num_stories.replace(/\D/g, '')) || 1;
  const dtcArr = spatialKeyData.us_hh_dtc_beach_distance.split(' ');
  let replacementCost = parseInt(spatialKeyData.us_hh_replacement_cost);
  let propertyCode = spatialKeyData.us_hh_property_use_code;
  let yearBuilt = parseInt(spatialKeyData.us_hh_year_built);
  let floodZone = spatialKeyData.us_hh_fema_all_params_zone;
  let CBRSDesignation = spatialKeyData.us_hh_fema_cbrs_params_designation;
  let basement = spatialKeyData.us_hh_assessment_basement;
  let distToCoastUnit = dtcArr[dtcArr.length - 1];
  let distToCoastFeet = parseInt(spatialKeyData.us_hh_dtc_beach_distance.replace(/\D/g, ''));

  if (distToCoastUnit.toLowerCase() === 'mile' || distToCoastUnit.toLowerCase() === 'miles') {
    distToCoastFeet = Math.round(5280 * distToCoastFeet);
  }

  // invariant(CBRSDesignation.toUpperCase() != 'OUT', 'Not ratable. Property within CBRS perimeter.');
  // // invariant(distToCoastFeet < 1000, 'Not ratable. Property within 1000 feet of coast.');
  // if (distToCoastFeet < 1000) {
  //   console.log('NOT RATABLE. WITHIN 1000FT OF COAST. OVERRIDE FOR DEV.');
  //   propertyNotes.push({
  //     code: 'not-ratable',
  //     message: 'Within 1000 ft. of coast. Overriding for dev.',
  //     property: 'distToCoastFeet',
  //   });
  // }
  // invariant(isNaN(replacementCost), 'Unable to retrived data required for rating.');
  // invariant(
  //   replacementCost < parseInt(process.env.FLOOD_MIN_RCV!),
  //   `REPLACEMENT COST VALUE LESS THAN ${process.env.FLOOD_MIN_RCV}`
  // );
  // invariant(
  //   replacementCost > parseFloat(process.env.FLOOD_MAX_RCV!),
  //   'Replacement cost exceeds $2M.'
  // );
  // TODO: handle missing year built - still able to rate ?? what val is used for yearBuilt in SR call ??
  // invariant(isNaN(yearBuilt), 'Missing year built');

  if (basement === '') basement = 'unknown';
  if (basement === 'B') basement = 'finished';

  return {
    requiresReview,
    propertyNotes,
    sqFootage,
    numStories,
    distToCoastFeet,
    replacementCost,
    propertyCode,
    yearBuilt,
    floodZone,
    CBRSDesignation,
    basement,
  };
}
