// import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
// import { defineSecret } from 'firebase-functions/params';
import { AxiosResponse } from 'axios';

import {
  LimitTypes,
  SpatialKeyResponse,
  isLatLng,
  calcSum,
  roundUpToNearest,
  getNumber,
  COLLECTIONS,
} from '../common';
import { getSpatialKeyInstance } from '../services';
import { CallableContext, HttpsError } from 'firebase-functions/v1/https';

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

// const spatialKeyUserKey = defineSecret('SPATIALKEY_USER_API_KEY');
// const spatialKeyOrgKey = defineSecret('SPATIALKEY_ORG_API_KEY');
// const spatialKeySecretKey = defineSecret('SPATIALKEY_ORG_SECRET_KEY');

// const maxLimitA = defineInt('FLOOD_MAX_LIMIT_A', {
//   default: 1000000,
// });
// const minLimitA = defineInt('FLOOD_MIN_LIMIT_A', {
//   default: 100000,
// });

export default async (data: any, context: CallableContext) => {
  console.log('data: ', data);
  const { lat, lng } = data;
  if (!lat || !lng || !isLatLng(lat, lng)) {
    throw new HttpsError('invalid-argument', `Invalid coordinates`);
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
    throw new HttpsError('internal', `Error fetching property data`);
  }

  if (spatialKeyData) {
    const fallback: { [key: string]: number | string | null } = {
      initLimitA: null,
      initLimitB: null,
      initLimitC: null,
      initLimitD: null,
      initDeductible: null,
      maxDeductible: 200000,
      spatialKeyDocId: null,
    };
    let skDocRef;

    try {
      skDocRef = await getFirestore()
        .collection(COLLECTIONS.SK_RES)
        .add({
          ...spatialKeyData,
        });
      console.log(`SpatialKey data saved to doc: ${skDocRef.id}`);
      fallback.spatialKeyDocId = skDocRef.id;
    } catch (err) {
      console.log('Error saving SK data to Firestore', err);
    }

    try {
      let validatedRatingData = await validateSpatialKeyRes(spatialKeyData!);
      let { replacementCost } = validatedRatingData;
      console.log('validated data: ', validatedRatingData);

      // invariant(!isNaN(replacementCost), 'Unable to determine data required for rating.');
      if (!replacementCost) return { ...validatedRatingData, ...fallback };

      let res: any;

      try {
        let MAX_A = parseInt(process.env.FLOOD_MAX_LIMIT_A!) || 1000000;
        // let MAX_BCD = parseInt(process.env.FLOOD_MAX_LIMIT_B_C_D!) || 1000000;
        let MIN_A = parseInt(process.env.FLOOD_MIN_LIMIT_A!) || 100000;
        // let MAX_A = maxLimitA.value() || 1000000;
        // let MIN_A = minLimitA.value() || 100000;

        // let RCVRef = Math.min(replacementCost, MAX_A);
        let limitARef = roundUpToNearest(Math.min(Math.max(replacementCost, MIN_A), MAX_A), 3);

        let defaults: InitLimits = {
          initLimitA: limitARef,
          initLimitB: roundUpToNearest(limitARef * defaultLimitPercents['limitB'], 3),
          initLimitC: roundUpToNearest(limitARef * defaultLimitPercents['limitC'], 3),
          initLimitD: roundUpToNearest(limitARef * defaultLimitPercents['limitD'], 3),
        };

        // DONT NEED TO VALIDATE SUM B,C,D - CALC BASED ON MAX OF 1M
        // let totalBCDRequested = defaults.initLimitB + defaults.initLimitC + defaults.initLimitD;
        // if (totalBCDRequested > MAX_BCD) {
        //   console.log('Recalculating limits. Total B, C, D: ', totalBCDRequested);
        //   // Pro rated B, C, D coverages (rounded down to 100)
        //   for (const [key, val] of Object.entries(defaults)) {
        //     if (key !== 'limitA') {
        //       defaults[key as keyof InitLimits] = roundDownToNearest(
        //         (val / totalBCDRequested) * MAX_BCD
        //       );
        //     }
        //   }
        // }

        res = { ...defaults, spatialKeyDocId: skDocRef?.id ?? null };
        const sumCoverage = calcSum(Object.values(defaults));
        res.initDeductible = roundUpToNearest(sumCoverage * 0.01, 3);
        res.maxDeductible = roundUpToNearest(sumCoverage * 0.2, 3);

        console.log('res: ', res);

        return { ...validatedRatingData, ...res };
      } catch (err) {
        console.log('ERROR CALCULATING DEFAULT LIMITS/DEDUCTIBLE. USING FALLBACK NFIP: ', err);
        return { ...validatedRatingData, ...fallback };
      }
    } catch (err) {
      console.log('ERROR VALIDATING SPATIAL KEY RESPONSE. USING FALLBACK NFIP: ', err);
      return { ...fallback };
      // throw new HttpsError(
      //   'internal',
      //   `Unable to determine data required for quoting.`
      // );
    }
  } else {
    throw new HttpsError('internal', `Error fetching property data`);
  }
};

async function validateSpatialKeyRes(spatialKeyData: SpatialKeyResponse) {
  // let requiresReview = false;
  // let propertyNotes: UWNote[] = [];

  let sqFootage = parseFloat(spatialKeyData.us_hh_square_footage) || null;
  let numStories = parseInt(spatialKeyData.us_hh_assessment_num_stories.replace(/\D/g, '')) || null; // || 1 (should default to 1 at later stage ??);
  let replacementCost = parseInt(spatialKeyData.us_hh_replacement_cost) || null;
  let propertyCode = spatialKeyData.us_hh_property_use_code;
  let yearBuilt = parseInt(spatialKeyData.us_hh_year_built) || null;
  let floodZone = spatialKeyData.us_hh_fema_all_params_zone;
  let CBRSDesignation = spatialKeyData.us_hh_fema_cbrs_params_designation;
  let basement = spatialKeyData.us_hh_assessment_basement;
  const dtcArr = spatialKeyData.us_hh_dtc_beach_distance.split(' ');
  let distToCoastUnit = dtcArr[dtcArr.length - 1];
  let distToCoastFeet = parseFloat(getNumber(spatialKeyData.us_hh_dtc_beach_distance));
  // let distToCoastFeet = parseInt(spatialKeyData.us_hh_dtc_beach_distance.replace(/\D/g, ''));

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
