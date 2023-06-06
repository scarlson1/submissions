import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { error, info } from 'firebase-functions/logger';
import { GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import invariant from 'tiny-invariant';

import { CLAIMS, defaultFloodZone, ratingDataCollection } from '../common';
import { getAALs, validateGetAALsProps } from '../utils/rating';
import { getPremium } from '../utils/rating';
import { swissReClientId, swissReClientSecret, swissReSubscriptionKey } from '../common';
import { GetPremiumCalcResult } from '../utils/rating/getPremium';
import { GetAALRes } from '../utils/rating/getAALs';

interface GetAnnualPremiumRequest {
  latitude: number;
  longitude: number;
  replacementCost: number;
  limitA: number;
  limitB: number;
  limitC: number;
  limitD: number;
  deductible: number;
  numStories: number;
  priorLossCount: string;
  state: string;
  floodZone?: string;
  basement?: string;
  commissionPct?: number;
  submissionId?: string | null;
  locationId?: string | null;
  externalId?: string | null;
}

export default async ({ data, auth }: CallableRequest<GetAnnualPremiumRequest>) => {
  const db = getFirestore();
  console.log('GET ANNUAL PREMIUM CALLED', data);

  if (!(auth && auth.uid && auth?.token[CLAIMS['IDEMAND_ADMIN']])) {
    throw new HttpsError('permission-denied', `${CLAIMS['IDEMAND_ADMIN']} permissions required`);
  }

  const {
    latitude,
    longitude,
    limitA,
    limitB,
    limitC,
    limitD,
    deductible,
    replacementCost,
    numStories,
    priorLossCount,
    floodZone = defaultFloodZone.value(),
    state,
    basement = 'unknown',
    commissionPct = 0.15,
    submissionId,
    locationId = null,
    externalId = null,
  } = data;

  try {
    // VALIDATE SWISS RE PROPS
    validateGetAALsProps(data);

    // VALIDATE NON-SWISS RE PROPS
    invariant(
      priorLossCount && typeof priorLossCount === 'string',
      'prior loss count must be "0", "1", or "2"'
    );
    invariant(floodZone && typeof floodZone === 'string', 'floodZone is required');
    invariant(basement && typeof basement === 'string', 'basement must be a string');
    invariant(
      commissionPct, // && typeof commissionPct === 'number',
      'commissionPct must be a number'
    );
    // TODO: DECIDE WHETHER TO HAVE A HARD LIMIT (can't override) ??
    invariant(commissionPct <= 0.2, 'commissionPct must be <= 20% (provided as decimal)');
  } catch (err: any) {
    console.log('INVALID PROPS: ', err);

    throw new HttpsError('failed-precondition', err.message);
  }

  let AALs: GetAALRes | undefined;
  try {
    const srClientId = swissReClientId.value();
    const srClientSecret = swissReClientSecret.value();
    const srSubKey = swissReSubscriptionKey.value();

    AALs = await getAALs({
      srClientId,
      srClientSecret,
      srSubKey,
      replacementCost,
      limitA,
      limitB,
      limitC,
      limitD,
      deductible,
      latitude,
      longitude,
      numStories,
    });
    // TODO: save to SR collection (see getSubmissionAAL)
  } catch (err: any) {
    console.log('ERROR GETTING AALs: ', err);

    throw new HttpsError('internal', 'Error fetching Average Anuual Loss');
  }

  const { inlandAAL, surgeAAL } = AALs;
  let result: GetPremiumCalcResult | undefined;

  try {
    invariant(typeof inlandAAL === 'number');
    invariant(typeof surgeAAL === 'number');

    result = getPremium({
      inlandAAL,
      surgeAAL,
      limitA,
      limitB,
      limitC,
      limitD,
      floodZone,
      state,
      basement,
      priorLossCount,
      commissionPct,
    });

    const { premiumData } = result;

    // TODO: update original submission ??

    info(`PREMIUM: ${premiumData.directWrittenPremium}`);

    if (
      !premiumData.directWrittenPremium ||
      typeof premiumData.directWrittenPremium !== 'number' ||
      premiumData.directWrittenPremium < 100
    )
      throw new Error('Error calculating premium');
  } catch (err: any) {
    error(`Error calculating premium`, {
      data,
      userId: auth.uid || null,
      message: err?.message || null,
      submissionId: submissionId || null,
    });
    let msg = `Error calculating annual premium`;
    if (err?.message) msg += ` (${err.message})`;

    throw new HttpsError('internal', msg);
  }

  try {
    const ratingColRef = ratingDataCollection(db);
    await ratingColRef.add({
      submissionId: submissionId || null,
      locationId,
      externalId,
      deductible: deductible,
      limits: {
        limitA,
        limitB,
        limitC,
        limitD,
      },
      tiv: result.tiv,
      // replacementCost,
      rcvs: {
        // TODO: change getAAL func to use same rcv keys (rcvA -> building, etc.)
        building: AALs.rcvs.rcvA,
        otherStructures: AALs.rcvs.rcvB,
        contents: AALs.rcvs.rcvC,
        BI: AALs.rcvs.rcvD,
        total: AALs.rcvs.total,
      },
      ratingPropertyData: {
        replacementCost,
        basement,
        floodZone,
        numStories,
        propertyCode: null,
        CBRSDesignation: null,
        distToCoastFeet: null,
        sqFootage: null,
        yearBuilt: null,
        ffe: null,
        // priorLossCount, TODO: fix typing error
      },
      aal: {
        inland: inlandAAL,
        surge: surgeAAL,
      },
      premiumCalcData: result.premiumData,
      pm: result.pm,
      riskScore: result.riskScore,
      stateMultipliers: result.stateMultipliers,
      secondaryFactorMults: result.secondaryFactorMults,
      coordinates: new GeoPoint(latitude, longitude),
      address: null,
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    });
  } catch (err) {
    console.log('ERROR SAVING RATING DOC: ', err);
  }

  return {
    annualPremium: result.premiumData.directWrittenPremium,
    inlandAAL,
    surgeAAL,
  };
};

// export const getAnnualPremium = functions
//   .runWith({ secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] })
//   .https.onCall(async (data: GetAnnualPremiumRequest, context) => {
//     const db = getFirestore();
//     const { auth } = context;
//     console.log('GET ANNUAL PREMIUM CALLED', data);

//     if (!(auth && auth.uid && auth?.token[CLAIMS['IDEMAND_ADMIN']])) {
//       throw new HttpsError(
//         'permission-denied',
//         'iDemand admin permissions required'
//       );
//     }

//     const srClientId = process.env.SWISS_RE_CLIENT_ID;
//     const srClientSecret = process.env.SWISS_RE_CLIENT_SECRET;
//     const srSubKey = process.env.SWISS_RE_SUBSCRIPTION_KEY;

//     if (!(srClientId && srClientSecret && srSubKey))
//       throw new HttpsError('failed-precondition', 'missing Swiss Re credentials');

//     // VALIDATE REQUEST DATA
//     const {
//       latitude,
//       longitude,
//       limitA,
//       limitB,
//       limitC,
//       limitD,
//       deductible,
//       replacementCost,
//       numStories,
//       priorLossCount,
//       floodZone = 'X',
//       state,
//       basement = 'unknown',
//       commissionPct = 0.15,
//       submissionId,
//     } = data;

//     try {
//       // VALIDATE SWISS RE PROPS
//       validateGetAALsProps(data);

//       // VALIDATE NON-SWISS RE PROPS
//       invariant(
//         priorLossCount && typeof priorLossCount === 'string',
//         'prior loss count must be "0", "1", or "2"'
//       );
//       invariant(floodZone && typeof floodZone === 'string', 'floodZone is required');
//       invariant(basement && typeof basement === 'string', 'basement must be a string');
//       invariant(
//         commissionPct, // && typeof commissionPct === 'number',
//         'commissionPct must be a number'
//       );
//       invariant(commissionPct <= 0.2, 'commissionPct must be <= 20% (provided as decimal)');
//     } catch (err: any) {
//       console.log('INVALID PROPS: ', err);

//       throw new HttpsError('failed-precondition', err.message);
//     }

//     let AALs;
//     try {
//       AALs = await getAALs({
//         srClientId,
//         srClientSecret,
//         srSubKey,
//         replacementCost,
//         limitA,
//         limitB,
//         limitC,
//         limitD,
//         deductible,
//         latitude,
//         longitude,
//         numStories,
//       });
//     } catch (err: any) {
//       console.log('ERROR GETTING AALs: ', err);

//       throw new HttpsError('internal', 'Error fetching Average Anuual Loss');
//     }

//     const { inlandAAL, surgeAAL } = AALs;
//     let result;

//     try {
//       invariant(typeof inlandAAL === 'number');
//       invariant(typeof surgeAAL === 'number');

//       result = getPremium({
//         inlandAAL,
//         surgeAAL,
//         limitA,
//         limitB,
//         limitC,
//         limitD,
//         floodZone,
//         state,
//         basement,
//         priorLossCount,
//         commissionPct,
//       });

//       const { premiumData } = result;

//       // TODO: save to ratingData collection
//       // TODO: update original submission

//       console.log(`PREMIUM: ${premiumData.directWrittenPremium}`);

//       if (
//         !premiumData.directWrittenPremium ||
//         typeof premiumData.directWrittenPremium !== 'number' ||
//         premiumData.directWrittenPremium < 100
//       )
//         throw new Error('Error calculating premium');
//     } catch (err: any) {
//       error('Error calculating premium', {
//         data,
//         userId: auth.uid || null,
//         message: err?.message || null,
//       });
//       throw new HttpsError('internal', 'Error calculating annual premium');
//     }

//     try {
//       await db.collection(COLLECTIONS.RATING_DATA).add({
//         submissionId: submissionId || null,
//         deductible: deductible,
//         limits: {
//           limitA,
//           limitB,
//           limitC,
//           limitD,
//         },
//         tiv: result.tiv,
//         replacementCost,
//         aal: {
//           inland: inlandAAL,
//           surge: surgeAAL,
//         },
//         pm: result.pm,
//         riskScore: result.riskScore,
//         stateMultipliers: result.stateMultipliers,
//         secondaryFactorMults: result.secondaryFactorMults,
//         floodZone,
//         basement,
//         ffe: 0,
//         numStories,
//         // sqFootage,
//         // distToCoast: 1000000,
//         // propertyCode: sub.propertyCode,
//         // yearBuilt: sub.yearBuilt,
//         // CBRSDesignation: sub.CBRSDesignation,
//         priorLossCount,
//         premiumData: result.premiumData,
//         coordinates: new GeoPoint(latitude, longitude),
//         metadata: {
//           created: Timestamp.now(),
//           updated: Timestamp.now(),
//         },
//       });
//     } catch (err) {
//       console.log('ERROR SAVING RATING DOC: ', err);
//     }

//     return {
//       annualPremium: result.premiumData.directWrittenPremium,
//       inlandAAL,
//       surgeAAL,
//     };
//   });

// import * as functions from 'firebase-functions';
// import { defineSecret } from 'firebase-functions/params';
// import invariant from 'tiny-invariant';

// import { CLAIMS, calcSum } from '../common';
// import { getSwissReInstance } from '../services';
// import { swissReBody } from '../firestoreEvents';
// import {
//   getInlandRiskScore,
//   getMinPremium,
//   getPM,
//   getPremiumData,
//   getRCVs,
//   getSecondaryFactorMults,
//   getSurgeRiskScore,
//   multipliersByState,
// } from '../utils/rating';

// const swissReClientId = defineSecret('SWISS_RE_CLIENT_ID');
// const swissReClientSecret = defineSecret('SWISS_RE_CLIENT_SECRET');
// const swissReSubscriptionKey = defineSecret('SWISS_RE_SUBSCRIPTION_KEY');

// // TODO: calc rcv from limits

// interface GetAnnualPremiumRequest {
//   latitude: number;
//   longitude: number;
//   replacementCost: number;
//   limitA: number;
//   limitB: number;
//   limitC: number;
//   limitD: number;
//   deductible: number;
//   numStories: number;
//   priorLossCount: string;
//   submissionId?: string | null;
//   state: string;
//   floodZone?: string;
//   basement?: string;
//   commissionPct?: number;
// }

// export const getAnnualPremium = functions
//   .runWith({ secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] })
//   .https.onCall(async (data: GetAnnualPremiumRequest, context) => {
//     // const db = getFirestore();
//     const { auth } = context;
//     console.log('GET ANNUAL PREMIUM CALLED', data);

//     if (!(auth && auth.uid && auth?.token[CLAIMS['IDEMAND_ADMIN']])) {
//       throw new HttpsError(
//         'permission-denied',
//         'iDemand admin permissions required'
//       );
//     }

//     const srClientId = process.env.SWISS_RE_CLIENT_ID;
//     const srClientSecret = process.env.SWISS_RE_CLIENT_SECRET;
//     const srSubKey = process.env.SWISS_RE_SUBSCRIPTION_KEY;

//     const minLimitA = parseInt(process.env.FLOOD_MIN_LIMIT_A || '100000');

//     if (!(srClientId && srClientSecret && srSubKey))
//       throw new HttpsError('failed-precondition', 'missing swiss re credentials');

//     // VALIDATE REQUEST DATA
//     const {
//       latitude,
//       longitude,
//       limitA,
//       limitB,
//       limitC,
//       limitD,
//       deductible,
//       priorLossCount,
//       numStories = 1,
//       replacementCost,
//       floodZone,
//       state,
//       basement = 'unknown',
//       commissionPct = 0.15,
//     } = data;
//     try {
//       // TODO: validate provided data
//       invariant(latitude && typeof latitude === 'number', 'invalid lat');
//       invariant(longitude && typeof longitude === 'number', 'invalid lng');
//       invariant(
//         deductible && typeof deductible === 'number' && deductible > 1000,
//         'invalid deductible. must be number > 1000'
//       );
//       invariant(priorLossCount, 'priorLossCount required');
//       invariant(numStories && typeof numStories === 'number', 'invalid numStories');
//       invariant(
//         limitA && typeof limitA === 'number' && limitA > minLimitA,
//         `LimitA must be a number > ${minLimitA}`
//       );
//       invariant(limitB && typeof limitB === 'number', 'LimitB must be a number');
//       invariant(limitC && typeof limitC === 'number', 'LimitC must be a number');
//       invariant(limitD && typeof limitD === 'number', 'LimitD must be a number');
//     } catch (err: any) {
//       throw new HttpsError('failed-precondition', err.message);
//     }

//     const swissReInstance = getSwissReInstance(srClientId, srClientSecret, srSubKey);

//     let ratingUpdates: { [key: string]: number } = { inlandAAL: 0, surgeAAL: 0 };

//     try {
//       const RCVs = getRCVs(replacementCost, { limitA, limitB, limitC, limitD });
//       const rcvAB = RCVs.rvcA + RCVs.rcvB;
//       const rcvTotal = calcSum(Object.values(RCVs));
//       const limitAB = limitA + limitB;
//       const xmlBodyVars = {
//         ...data,
//         lat: latitude,
//         lng: longitude,
//         rcvAB,
//         rcvC: RCVs.rcvC,
//         rcvD: RCVs.rcvD,
//         limitAB,
//         rcvTotal,
//       };
//       const body = swissReBody(xmlBodyVars);

//       const { data: srRes } = await swissReInstance.post('/rate/sync/srxplus/losses', body, {
//         headers: {
//           'Content-Type': 'application/octet-stream',
//         },
//       });

//       console.log('SWISS RE RES: ', srRes);
//       let code200Index = srRes.expectedLosses.findIndex(
//         (floodObj: any) => floodObj.perilCode === '200'
//       );
//       let code300Index = srRes.expectedLosses.findIndex(
//         (floodObj: any) => floodObj.perilCode === '300'
//       );

//       if (code200Index !== -1) {
//         ratingUpdates.surgeAAL = srRes.expectedLosses[code200Index]?.preCatLoss ?? 0;
//       }
//       if (code300Index !== -1) {
//         ratingUpdates.inlandAAL = srRes.expectedLosses[code300Index]?.preCatLoss ?? 0;
//       }

//       console.log(`AAL: ${JSON.stringify(ratingUpdates)}`);

//       // TODO: decide whether to save new rating doc

//       // const swissReRef = await swissReResCollection(db).add({
//       //   ...data,
//       //   ...ratingUpdates,
//       //   submissionId: snap.id,
//       //   address: {
//       //     addressLine1: sub.addressLine1,
//       //     addressLine2: sub.addressLine2,
//       //     city: sub.city,
//       //     state: sub.state,
//       //     postal: sub.postal,
//       //   },
//       //   coordinates: sub.coordinates,
//       // });
//     } catch (err) {
//       console.log('ERROR FETCHING SR AAL DATA', err);
//       throw new HttpsError('internal', 'Error calling Swiss Re api');
//     }

//     // TODO: abstrct to one function to do rating
//     try {
//       const { inlandAAL, surgeAAL } = ratingUpdates;

//       const tiv = calcSum([limitA, limitB, limitC, limitD]);

//       const minPremium = getMinPremium(floodZone || 'D', tiv);

//       const pm = {
//         inland: getPM(inlandAAL, tiv),
//         surge: getPM(surgeAAL, tiv),
//       };
//       const riskScore = {
//         inland: getInlandRiskScore(pm.inland),
//         surge: getSurgeRiskScore(pm.surge),
//       };
//       // Flood type multipliers by state
//       const { inlandStateMult = 1.5, surgeStateMult = 3 } = multipliersByState[state];

//       let secondaryFactorMults = getSecondaryFactorMults({
//         ffe: 0,
//         basement: basement,
//         priorLossCount,
//         inlandRiskScore: riskScore.inland,
//         surgeRiskScore: riskScore.surge,
//       });

//       let premiumData = getPremiumData({
//         AAL: {
//           inland: inlandAAL,
//           surge: surgeAAL,
//         },
//         secondaryFactorMults,
//         stateMultipliers: {
//           inland: inlandStateMult,
//           surge: surgeStateMult,
//         },
//         minPremium,
//         subproducerComPct: commissionPct,
//       });

//       // TODO: save to ratingData collection

//       // TODO: update original submission

//       console.log(`PREMIUM: ${premiumData.directWrittenPremium}`);

//       return {
//         annualPremium: premiumData.directWrittenPremium,
//       };
//     } catch (err) {
//       throw new HttpsError('internal', 'Error calculating annual premium');
//     }
//   });
