import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import invariant from 'tiny-invariant';

import { CLAIMS, calcSum } from '../common';
import { getSwissReInstance } from '../services';
import { swissReBody } from '../firestoreEvents';
import {
  getInlandRiskScore,
  getMinPremium,
  getPM,
  getPremiumData,
  getSecondaryFactorMults,
  getSurgeRiskScore,
  multipliersByState,
} from '../utils/rating';

const swissReClientId = defineSecret('SWISS_RE_CLIENT_ID');
const swissReClientSecret = defineSecret('SWISS_RE_CLIENT_SECRET');
const swissReSubscriptionKey = defineSecret('SWISS_RE_SUBSCRIPTION_KEY');

interface GetAnnualPremiumRequest {
  lat: number;
  lng: number;
  rcvA: number;
  rcvB: number;
  rcvC: number;
  rcvD: number;
  limitA: number;
  limitB: number;
  limitC: number;
  limitD: number;
  deductible: number;
  numStories: number;
  submissionId?: string | null;
  state: string;
  floodZone?: string;
  basement?: string;
  commissionPct?: number;
}

export const getAnnualPremium = functions
  .runWith({ secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] })
  .https.onCall(async (data: GetAnnualPremiumRequest, context) => {
    // const db = getFirestore();
    const { auth } = context;
    console.log('GET ANNUAL PREMIUM CALLED', data);

    if (!(auth && auth.uid && auth?.token[CLAIMS['IDEMAND_ADMIN']])) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'iDemand admin permissions required'
      );
    }

    const srClientId = process.env.SWISS_RE_CLIENT_ID;
    const srClientSecret = process.env.SWISS_RE_CLIENT_SECRET;
    const srSubKey = process.env.SWISS_RE_SUBSCRIPTION_KEY;

    const minLimitA = parseInt(process.env.FLOOD_MIN_LIMIT_A || '100000');

    if (!(srClientId && srClientSecret && srSubKey))
      throw new functions.https.HttpsError('failed-precondition', 'missing swiss re credentials');

    // VALIDATE REQUEST DATA
    const {
      lat,
      lng,
      limitA,
      limitB,
      limitC,
      limitD,
      deductible,
      numStories = 1,
      rcvA,
      rcvB,
      rcvC,
      rcvD,
      floodZone,
      state,
      basement = 'unknown',
      commissionPct = 0.15,
    } = data;
    try {
      // TODO: validate provided data
      invariant(lat && typeof lat === 'number', 'invalid lat');
      invariant(lng && typeof lng === 'number', 'invalid lng');
      invariant(
        deductible && typeof deductible === 'number' && deductible > 1000,
        'invalid deductible. must be number > 1000'
      );
      invariant(numStories && typeof numStories === 'number', 'invalid numStories');
      invariant(
        limitA && typeof limitA === 'number' && limitA > minLimitA,
        `LimitA must be a number > ${minLimitA}`
      );
      invariant(limitB && typeof limitB === 'number', 'LimitB must be a number');
      invariant(limitC && typeof limitC === 'number', 'LimitC must be a number');
      invariant(limitD && typeof limitD === 'number', 'LimitD must be a number');
    } catch (err: any) {
      throw new functions.https.HttpsError('failed-precondition', err.message);
    }

    const swissReInstance = getSwissReInstance(srClientId, srClientSecret, srSubKey);

    let ratingUpdates: { [key: string]: number } = { inlandAAL: 0, surgeAAL: 0 };

    try {
      const rcvAB = rcvA + rcvB;
      const rcvTotal = rcvAB + rcvC + rcvD;
      const limitAB = limitA + limitB;
      const xmlBodyVars = { ...data, rcvAB, limitAB, rcvTotal };
      const body = swissReBody(xmlBodyVars);

      const { data: srRes } = await swissReInstance.post('/rate/sync/srxplus/losses', body, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });

      console.log('SWISS RE RES: ', srRes);
      let code200Index = srRes.expectedLosses.findIndex(
        (floodObj: any) => floodObj.perilCode === '200'
      );
      let code300Index = srRes.expectedLosses.findIndex(
        (floodObj: any) => floodObj.perilCode === '300'
      );

      if (code200Index !== -1) {
        ratingUpdates.surgeAAL = srRes.expectedLosses[code200Index]?.preCatLoss ?? 0;
      }
      if (code300Index !== -1) {
        ratingUpdates.inlandAAL = srRes.expectedLosses[code300Index]?.preCatLoss ?? 0;
      }

      console.log(`AAL: ${JSON.stringify(ratingUpdates)}`);

      // TODO: decide whether to save new rating doc

      // const swissReRef = await swissReResCollection(db).add({
      //   ...data,
      //   ...ratingUpdates,
      //   submissionId: snap.id,
      //   address: {
      //     addressLine1: sub.addressLine1,
      //     addressLine2: sub.addressLine2,
      //     city: sub.city,
      //     state: sub.state,
      //     postal: sub.postal,
      //   },
      //   coordinates: sub.coordinates,
      // });
    } catch (err) {
      console.log('ERROR FETCHING SR AAL DATA', err);
      throw new functions.https.HttpsError('internal', 'Error calling Swiss Re api');
    }

    // TODO: abstrct to one function to do rating
    try {
      const { inlandAAL, surgeAAL } = ratingUpdates;

      const tiv = calcSum([limitA, limitB, limitC, limitD]);

      const minPremium = getMinPremium(floodZone || 'D', tiv);

      const pm = {
        inland: getPM(inlandAAL, tiv),
        surge: getPM(surgeAAL, tiv),
      };
      const riskScore = {
        inland: getInlandRiskScore(pm.inland),
        surge: getSurgeRiskScore(pm.surge),
      };
      // Flood type multipliers by state
      const { inlandStateMult = 1.5, surgeStateMult = 3 } = multipliersByState[state];

      let secondaryFactorMults = getSecondaryFactorMults({
        ffe: 0,
        basement: basement,
        inlandRiskScore: riskScore.inland,
        surgeRiskScore: riskScore.surge,
      });

      let premiumData = getPremiumData({
        AAL: {
          inland: inlandAAL,
          surge: surgeAAL,
        },
        secondaryFactorMults,
        stateMultipliers: {
          inland: inlandStateMult,
          surge: surgeStateMult,
        },
        minPremium,
        subproducerComPct: commissionPct,
      });

      // TODO: save to ratingData collection

      // TODO: update original submission

      console.log(`PREMIUM: ${premiumData.directWrittenPremium}`);

      return {
        annualPremium: premiumData.directWrittenPremium,
      };
    } catch (err) {
      throw new functions.https.HttpsError('internal', 'Error calculating annual premium');
    }
  });
