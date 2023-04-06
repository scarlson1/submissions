import * as functions from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

import { calcSum, COLLECTIONS } from '../common';
import {
  multipliersByState,
  getInlandRiskScore,
  getSurgeRiskScore,
  getMinPremium,
  getPremiumData,
  getPM,
  getSecondaryFactorMults,
} from '../utils/rating';

export interface CalcQuoteRequest {
  limitA: number;
  limitB: number;
  limitC: number;
  limitD: number;
  inlandAAL: number;
  surgeAAL: number;
  replacementCost: number;
  deductible: number;
  state: string;
  floodZone: string;
  submissionId: string;
  basement?: string;
  commissionPct?: number;
}

export const calcQuote = functions.https.onCall(async (data, context) => {
  console.log('data: ', data);
  const db = getFirestore();
  const {
    limitA,
    limitB,
    limitC,
    limitD,
    inlandAAL,
    surgeAAL,
    replacementCost,
    deductible,
    floodZone = 'D',
    state,
    basement = 'unknown',
    // TODO: prior loss count
    commissionPct = 0.15,
    submissionId,
  } = data;
  const userId = context.auth?.uid;

  if (!userId) throw new functions.https.HttpsError('unauthenticated', 'must be authenticated');
  if (!context.auth?.token.iDemandAdmin)
    throw new functions.https.HttpsError('permission-denied', 'must have admin permissions');

  if (!(limitA && limitB && limitC && limitD)) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'must provide value for each limits'
    );
  }
  if (
    !(
      typeof limitA === 'number' &&
      typeof limitB === 'number' &&
      typeof limitC === 'number' &&
      typeof limitD === 'number'
    )
  ) {
    throw new functions.https.HttpsError('failed-precondition', 'limits must be a number');
  }
  if (limitA < 100000) {
    throw new functions.https.HttpsError('failed-precondition', 'limitA must be at least 100,000');
  }
  if (!(replacementCost && typeof replacementCost === 'number')) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'replacementCost required and must be a number'
    );
  }
  if (!(deductible && typeof deductible === 'number' && deductible > 1000)) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'deductible must be a number greater than 1000'
    );
  }
  if (
    !(
      (inlandAAL || inlandAAL === 0) &&
      typeof inlandAAL === 'number' &&
      (surgeAAL || surgeAAL === 0) &&
      typeof surgeAAL === 'number'
    )
  ) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'inlandAAL and surgeAAL must be numbers'
    );
  }
  if (!(state && typeof state === 'string' && state.length === 2)) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'state must be a two character string'
    );
  }

  try {
    const tiv = calcSum([limitA, limitB, limitC, limitD]);

    const minPremium = getMinPremium(floodZone, tiv);

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
      basement,
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

    console.log('PREMIUM DATA: ', premiumData);
    // TODO: fetch taxes ??

    // TODO: save rating data
    await db.collection(COLLECTIONS.RATING_DATA).add({
      submissionId: submissionId || null,
      deductible,
      limits: {
        limitA,
        limitB,
        limitC,
        limitD,
      },
      tiv,
      replacementCost,
      aal: {
        inland: inlandAAL,
        surge: surgeAAL,
      },
      pm,
      riskScore,
      stateMultipliers: {
        inland: inlandStateMult,
        surge: surgeStateMult,
      },
      secondaryFactorMults,
      floodZone,
      basement,
      ffe: 0,
      premiumData: {
        minPremium,
        ...premiumData,
      },
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    });

    // TODO: update the submission ?? quote data not stored on submission

    return { annualPremium: premiumData.directWrittenPremium };
  } catch (err) {
    console.log('ERROR: ', err);
    throw new functions.https.HttpsError('invalid-argument', 'Error calculating quote');
  }
});
