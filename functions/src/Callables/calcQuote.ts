import { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v1/https';
import { error } from 'firebase-functions/logger';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import invariant from 'tiny-invariant';

import { COLLECTIONS } from '../common';
import { getPremium } from '../utils/rating';
import { maxA, maxBCD, minA } from '../common';

// TODO: create rating inputs interface (used in multiple funcs), extend where needed

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
  priorLossCount: string;
  submissionId: string;
  basement?: string;
  commissionPct?: number;
}

export default async ({ data, auth }: CallableRequest<CalcQuoteRequest>) => {
  console.log('CALC QUOTE DATA: ', data);
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
    priorLossCount,
    floodZone = 'Xcalc',
    state,
    basement = 'unknown',
    commissionPct = 0.15,
    submissionId,
  } = data;
  const userId = auth?.uid;

  if (!userId) throw new HttpsError('unauthenticated', 'must be authenticated');
  if (!auth?.token.iDemandAdmin)
    throw new HttpsError('permission-denied', 'must have admin permissions');

  try {
    // TODO: reuse existing validation function
    const MAX_A = maxA.value();
    const MIN_A = minA.value();
    const MAX_BCD = maxBCD.value();

    invariant(
      limitA && typeof limitA === 'number' && limitA > MIN_A,
      `LimitA must be a number > ${MIN_A}`
    );
    invariant(limitA >= MIN_A && limitA <= MAX_A, `limitA must be between ${MIN_A} and ${MAX_A}`);
    invariant((limitB || limitB === 0) && typeof limitB === 'number', 'LimitB must be a number');
    invariant((limitC || limitC === 0) && typeof limitC === 'number', 'LimitC must be a number');
    invariant((limitD || limitD === 0) && typeof limitD === 'number', 'LimitD must be a number');
    const totalBCD = limitB + limitC + limitD;
    invariant(totalBCD <= MAX_BCD, `sum of limits B, C, D must be less than ${MAX_BCD}`);

    invariant(
      deductible && typeof deductible === 'number' && deductible > 1000,
      'invalid deductible. must be number > 1000'
    );

    invariant(replacementCost, 'replacementCost required');
    invariant(typeof replacementCost === 'number', 'replacementCost must be a number');
    invariant(replacementCost > 100000, 'replacementCost must be > 100k');

    invariant(floodZone && typeof floodZone === 'string', 'floodZone is required');
    invariant(basement && typeof basement === 'string', 'basement must be a string');

    invariant(commissionPct && typeof commissionPct === 'number', 'commissionPct');
    invariant(
      (inlandAAL || inlandAAL === 0) && typeof inlandAAL === 'number',
      'inland AAL must be a number'
    );
    invariant(
      (surgeAAL || surgeAAL === 0) && typeof surgeAAL === 'number',
      'surgeAAL must be a number'
    );
    invariant(
      state && typeof state === 'string' && state.length === 2,
      'state must be a two letter abbreviation'
    );
  } catch (err: any) {
    // console.log('INVALID PROPS: ', err);
    let msg = err?.message || 'Provided params failed validation';
    msg = msg.replace(/(Invariant failed: )/g, '');
    error('Invalid props', {
      props: data,
      userId,
      function: 'calcQuote',
    });

    throw new HttpsError('failed-precondition', msg);
  }

  try {
    const result = getPremium({
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

    console.log('PREMIUM DATA: ', result);
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
      tiv: result.tiv,
      replacementCost,
      aal: {
        inland: inlandAAL,
        surge: surgeAAL,
      },
      pm: result.pm,
      riskScore: result.riskScore,
      stateMultipliers: result.stateMultipliers,
      secondaryFactorMults: result.secondaryFactorMults,
      floodZone,
      basement,
      ffe: 0,
      priorLossCount,
      premiumData: result.premiumData,
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    });

    // TODO: update the submission ?? quote data not stored on submission

    return { annualPremium: result.premiumData.directWrittenPremium };
  } catch (err: any) {
    console.log('ERROR: ', err);
    error('Error calculating quote', {
      props: data,
      userId,
      function: 'calcQuote',
      message: err?.message || '',
      stack: err?.stack || null,
    });
    throw new HttpsError('invalid-argument', 'Error calculating quote');
  }
};
