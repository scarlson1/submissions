import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore'; // Timestamp, FieldValue
// import 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import invariant from 'tiny-invariant';

import { Limits, LimitTypes, SpatialKeyResponse } from '../common/types';
import { getSpatialKeyInstance } from '../services';
import { AxiosResponse } from 'axios';
import { isLatLng, calcSum, roundDownToNearest, roundUpToNearest } from '../common/helpers';

let defaultLimitPercents: { [key in LimitTypes]: number } = {
  limitA: 1,
  limitB: 0.05,
  limitC: 0.25,
  limitD: 0.1,
};

const spatialKeyUserKey = defineSecret('SPATIALKEY_USER_API_KEY');
const spatialKeyOrgKey = defineSecret('SPATIALKEY_ORG_API_KEY');
const spatialKeySecretKey = defineSecret('SPATIALKEY_ORG_SECRET_KEY');

export const getPropertyDetails = functions
  .runWith({
    secrets: [spatialKeyUserKey, spatialKeyOrgKey, spatialKeySecretKey],
    minInstances: 1,
    memory: '128MB',
  })
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
      try {
        const skDocRef = await getFirestore()
          .collection('spatialKey')
          .add({
            ...spatialKeyData,
          });
        console.log(`SpatialKey data saved to doc: ${skDocRef.id}`);
      } catch (err) {
        console.log('Error saving SK data to Firestore', err);
      }

      let validatedRatingData = await validateSpatialKeyRes(spatialKeyData!);
      let { replacementCost } = validatedRatingData;
      console.log('validated data: ', validatedRatingData);
      invariant(!isNaN(replacementCost), 'Unable to retrived data required for rating.');

      let MAX_A = parseInt(process.env.FLOOD_MAX_LIMIT_A!) || 1000000;
      let MAX_BCD = parseInt(process.env.FLOOD_MAX_LIMIT_B_C_D!) || 1000000;
      let MIN_A = parseInt(process.env.FLOOD_MIN_LIMIT_A!) || 100000;

      let defaults: Limits = {
        limitA: roundUpToNearest(Math.min(Math.max(replacementCost, MIN_A), MAX_A), 3),
        limitB: roundUpToNearest(replacementCost * defaultLimitPercents['limitB'], 3),
        limitC: roundUpToNearest(replacementCost * defaultLimitPercents['limitC'], 3),
        limitD: roundUpToNearest(replacementCost * defaultLimitPercents['limitD'], 3),
      };

      let totalBCDRequested = defaults.limitB + defaults.limitC + defaults.limitD;
      if (totalBCDRequested > MAX_BCD) {
        console.log('Recalculating limits. Total B, C, D: ', totalBCDRequested);
        // Pro rated B, C, D coverages (rounded down to 100)
        for (const [key, val] of Object.entries(defaults)) {
          if (key !== 'limitA') {
            defaults[key as keyof Limits] = roundDownToNearest((val / totalBCDRequested) * MAX_BCD);
          }
        }
      }

      let res: any = { ...defaults };
      const sumCoverage = calcSum(Object.values(defaults));
      res.deductible = roundUpToNearest(sumCoverage * 0.01, 3);
      res.maxDeductible = roundUpToNearest(sumCoverage * 0.2, 3);

      console.log('res: ', res);

      return { ...validatedRatingData, ...res };
    } else {
      throw new functions.https.HttpsError('internal', `Error fetching property data`);
    }
  });

async function validateSpatialKeyRes(spatialKeyData: SpatialKeyResponse) {
  // let requiresReview = false;
  // let propertyNotes: UWNote[] = [];

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
  // invariant(!isNaN(replacementCost), 'Unable to retrived data required for rating.');
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

  // requiresReview,
  // propertyNotes,
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
  };
}
