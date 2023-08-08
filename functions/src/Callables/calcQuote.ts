import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v1/https';
import { CallableRequest } from 'firebase-functions/v2/https';

import { Limits, ValueByRiskType, defaultFloodZone, ratingDataCollection } from '../common';
import { onCallWrapper } from '../services/sentry';
import {
  getPremium,
  getRCVs,
  validateAALs,
  validateBasement,
  validateCommission,
  validateDeductible,
  validateFloodZone,
  validateLimits,
  validateReplacementCost,
  validateState,
} from '../utils/rating';
import { requireIDemandAdminClaims } from './utils';

// TODO: create rating inputs interface (used in multiple funcs), extend where needed

export interface CalcQuoteRequest {
  limits: Limits;
  AALs: ValueByRiskType;
  replacementCost: number;
  deductible: number;
  state: string;
  floodZone: string;
  priorLossCount: string;
  submissionId: string;
  basement?: string;
  commissionPct?: number;
}

export interface CalcQuoteResponse {
  annualPremium: number;
  ratingDocId?: string;
}

const calcQuote = async ({ data, auth }: CallableRequest<CalcQuoteRequest>) => {
  info('CALC QUOTE DATA: ', data);

  requireIDemandAdminClaims(auth?.token);

  const db = getFirestore();
  const {
    limits,
    AALs,
    replacementCost,
    deductible,
    priorLossCount,
    floodZone = defaultFloodZone.value(),
    state,
    basement = 'unknown',
    commissionPct = 0.15,
    submissionId,
  } = data;

  try {
    validateLimits(limits);
    validateDeductible(deductible);
    validateReplacementCost(replacementCost);
    validateFloodZone(floodZone);
    validateBasement(basement);
    validateCommission(commissionPct);
    validateAALs(AALs);
    validateState(state);
  } catch (err: any) {
    // console.log('INVALID PROPS: ', err);
    let msg = err?.message || 'Provided params failed validation';
    msg = msg.replace(/(Invariant failed: )/g, '');
    error('Invalid props', {
      props: data,
      userId: auth?.uid,
      function: 'calcQuote',
    });

    throw new HttpsError('failed-precondition', msg);
  }

  try {
    const result = getPremium({
      AALs: AALs,
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
    const ratingDocRef = await ratingDataCol.add({
      submissionId: submissionId || null,
      deductible,
      limits,
      TIV: result.tiv,
      RCVs,
      // TODO: Decide whether to require all rating property data and RCVs in request
      // OR use a discriminating union type
      ratingPropertyData: {
        floodZone,
        basement,
        FFH: 0,
        CBRSDesignation: null,
        distToCoastFeet: null,
        numStories: null,
        propertyCode: null,
        replacementCost: null,
        sqFootage: null,
        yearBuilt: null,
        priorLossCount: priorLossCount ?? null,
      },
      AALs,
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

    return { annualPremium: result.premiumData.directWrittenPremium, ratingDocId: ratingDocRef.id };
  } catch (err: any) {
    console.log('ERROR: ', err);
    error('Error calculating quote', {
      props: data,
      userId: auth?.uid,
      function: 'calcQuote',
      message: err?.message || null,
      stack: err?.stack || null,
    });
    throw new HttpsError('invalid-argument', 'Error calculating quote');
  }
};

export default onCallWrapper<CalcQuoteRequest>('calcQuote', calcQuote);
