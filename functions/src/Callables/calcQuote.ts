import { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v1/https';
import { error, info } from 'firebase-functions/logger';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import invariant from 'tiny-invariant';

import { Limits, ValueByRiskType, ratingDataCollection } from '../common';
import { getPremium, getRCVs } from '../utils/rating';
import { maxA, maxBCD, minA } from '../common';

// TODO: create rating inputs interface (used in multiple funcs), extend where needed

export interface CalcQuoteRequest {
  limits: Limits;
  AAL: ValueByRiskType;
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
    limits,
    AAL,
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

    invariant(limits, 'Limits required');
    invariant(AAL, 'AAL required');

    const { limitA, limitB, limitC, limitD } = limits;

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
      commissionPct >= 0.05 && commissionPct <= 0.2,
      'commissionPct must be between 0.05 and 0.2'
    );
    invariant(
      (AAL.inland || AAL.inland === 0) && typeof AAL.inland === 'number',
      'inland AAL must be a number'
    );
    invariant(
      (AAL.surge || AAL.surge === 0) && typeof AAL.surge === 'number',
      'surgeAAL must be a number'
    );
    invariant(
      (AAL.tsunami || AAL.tsunami === 0) && typeof AAL.tsunami === 'number',
      'tsunamiAAL must be a number'
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
      AAL: AAL,
      limits,
      floodZone,
      state,
      basement,
      priorLossCount,
      commissionPct,
    });

    info('PREMIUM DATA: ', { ...result });

    const RCVs = getRCVs(replacementCost, limits);

    const ratingDataCol = ratingDataCollection(db);
    await ratingDataCol.add({
      submissionId: submissionId || null,
      deductible,
      limits,
      TIV: result.tiv,
      RCVs,
      // TODO: Decide whether to require all rating property data and rcvs in request
      // OR use a discriminating union type
      ratingPropertyData: {
        floodZone,
        basement,
        ffe: 0,
        CBRSDesignation: null,
        distToCoastFeet: null,
        numStories: null,
        propertyCode: null,
        replacementCost: null,
        sqFootage: null,
        yearBuilt: null,
      },
      // priorLossCount,
      // replacementCost,
      AAL,
      PM: result.pm,
      riskScore: result.riskScore,
      stateMultipliers: result.stateMultipliers,
      secondaryFactorMults: result.secondaryFactorMults,
      premiumCalcData: result.premiumData,
      coordinates: null,
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
      message: err?.message || null,
      stack: err?.stack || null,
    });
    throw new HttpsError('invalid-argument', 'Error calculating quote');
  }
};
