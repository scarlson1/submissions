import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import axios, { AxiosResponse } from 'axios';
import { round } from 'lodash';

import {
  LimitTypes,
  calcSum,
  roundUpToNearest,
  attomKey as attomKeySecret,
  audience,
  maxA,
  minA,
} from '../common';
import { getAttomInstance } from '../services';

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

// const attomKey = defineSecret('ATTOM_API_KEY');

export default async ({ data }: CallableRequest) => {
  console.log('data: ', data);
  const { addressLine1, addressLine2 = '', city, state, postal = '' } = data;
  if (!addressLine1 || !city || !state) {
    throw new HttpsError('invalid-argument', `Missing address components in request body`);
  }

  const attomKey = attomKeySecret.value();
  if (!attomKey) throw new HttpsError('internal', `Missing property data api key`);
  const attomInstance = getAttomInstance(attomKey);

  let basicProfileRes;
  let profile;
  let propertyDetails;
  try {
    if (audience.value() === 'DEV HUMANS' || audience.value() === 'LOCAL HUMANS') {
      console.log('USING MOCK RESPONSE FROM GITHUB');
      const { data: githubMockData } = await axios.get(
        'https://scarlson1.github.io/data/attom.json'
      );
      basicProfileRes = githubMockData;
    } else {
      let { data: basicRes }: AxiosResponse<any> = await attomInstance.get(
        `/propertyapi/v1.0.0/property/basicprofile?address1=${encodeURIComponent(
          `${addressLine1} ${addressLine2}`.trim()
        )}&address2=${encodeURIComponent(`${city}, ${state} ${postal}`.trim())}`
      );
      basicProfileRes = basicRes;
    }
    profile =
      basicProfileRes?.property && basicProfileRes.property.length > 0
        ? basicProfileRes.property[0]
        : null;
    console.log('BASIC PROFILE: ', profile);

    // TODO: get property details ??
  } catch (err) {
    throw new HttpsError('internal', `Error fetching property data`);
  }

  if (profile) {
    const fallback: { [key: string]: number | string | null } = {
      initLimitA: null,
      initLimitB: null,
      initLimitC: null,
      initLimitD: null,
      initDeductible: null,
      maxDeductible: 200000,
      attomDocId: null,
    };
    let attomDocRef;

    try {
      attomDocRef = await getFirestore()
        .collection('attom')
        .add({
          basicProfileResponse: basicProfileRes,
          profile: profile || null,
          detailsRes: propertyDetails || null,
          attomId: profile.identifier.attomId || null,
          metadata: {
            created: Timestamp.now(),
          },
        });
      console.log(`Attom data saved to doc: ${attomDocRef.id}`);
      fallback.attomDocId = attomDocRef.id;
    } catch (err) {
      console.log('Error saving Attom data to Firestore', err);
    }

    try {
      let validatedRatingData = await validateAttomRes(profile);
      let { replacementCost } = validatedRatingData;
      console.log('validated data: ', validatedRatingData);

      if (!replacementCost) return { ...validatedRatingData, ...fallback };

      let res: any;

      try {
        let MAX_A = maxA.value();
        let MIN_A = minA.value();

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

        res = { ...defaults, attomDocId: attomDocRef?.id ?? null };
        const sumCoverage = calcSum(Object.values(defaults));
        res.initDeductible = roundUpToNearest(sumCoverage * 0.01, 3);
        res.maxDeductible = roundUpToNearest(sumCoverage * 0.2, 3);

        console.log('res: ', res);

        return { ...validatedRatingData, ...res };
      } catch (err) {
        console.log(
          'ERROR CALCULATING DEFAULT LIMITS/DEDUCTIBLE. USING FALLBACK NFIP. ERROR: ',
          err
        );

        return { ...validatedRatingData, ...fallback };
      }
    } catch (err) {
      console.log('ERROR VALIDATING SPATIAL KEY RESPONSE. USING FALLBACK NFIP. ERROR: ', err);

      return { ...fallback };
    }
  } else {
    throw new HttpsError('internal', `Error fetching property data`);
  }
};

interface AttomBasicProfile {
  [key: string]: any;
}

async function validateAttomRes(attomData: AttomBasicProfile) {
  const { summary, building, assessment } = attomData;

  let sqFootage = building?.size?.livingSize || null;
  let numStories = summary?.levels || 1; // (should default to 1 at later stage ??);
  let replacementCost = tempCalcRCV(assessment);
  let propertyCode = summary?.propType || null;
  let yearBuilt = summary?.yearBuilt || null; // TODO: worth calling details endpoint for effectiveyearbuilt ??
  let floodZone = ''; // attomData.us_hh_fema_all_params_zone;
  let CBRSDesignation = ''; // attomData.us_hh_fema_cbrs_params_designation;
  let basement = building?.interior?.bsmtType ? building?.interior?.bsmtType.toLowerCase() : 'no';
  let distToCoastFeet = 1000000;

  // TODO: BUILDING SQ FOOTAGE. WHICH NUMBER? living size ??
  // "size": {
  //   "bldgSize": 4592,
  //   "grossSize": 5960,
  //   "grossSizeAdjusted": 4592,
  //   "groundFloorSize": 2707,
  //   "livingSize": 4592,
  //   "sizeInd": "LIVING SQFT",
  //   "universalSize": 4592,
  //   "atticSize": 480
  // },

  const bsmtSize = building?.interior?.bsmtSize ? building?.interior?.bsmtSize : null;
  if (basement !== null && bsmtSize && bsmtSize > 0 && typeof numStories === 'number') numStories++;
  if (basement === '') basement = 'unknown';

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

function tempCalcRCV(assessment: any) {
  if (!assessment) return null;
  const { market, assessed } = assessment;

  // if no market values, try assessed total value (land & building)
  if (!market) {
    if (assessed && assessed.assdTtlValue) return assessed.assdTtlValue;
    return null;
  }

  const { mktImprValue, mktTtlValue } = market; // mktLandValue,

  if (mktImprValue && mktTtlValue) {
    const improvedToTotalRatio = mktImprValue / mktTtlValue;
    if (improvedToTotalRatio < 0.4) return round(mktTtlValue * 0.6);
  }

  if (mktImprValue) return market.mktImprValue;

  return null;
}
