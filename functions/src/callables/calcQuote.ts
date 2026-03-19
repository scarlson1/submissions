import {
  Basement,
  CommSource,
  FloodZone,
  Limits,
  PriorLossCount,
  ValueByRiskType,
} from '@idemand/common';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { HttpsError } from 'firebase-functions/v1/https';
import { CallableRequest } from 'firebase-functions/v2/https';
import { defaultFloodZone, ratingDataCollection } from '../common/index.js';
import {
  getComm,
  getPremium,
  getRCVs,
  validateAALs,
  validateBasement,
  validateDeductible,
  validateFloodZone,
  validateLimits,
  validateReplacementCost,
  validateState,
} from '../modules/rating/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireIDemandAdminClaims } from './utils/index.js';

// TODO: create rating inputs interface (used in multiple funcs), extend where needed

// TODO: zod validation for rating data (instead of "as" assertion)

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
  // commissionPct?: number;
  commSource: CommSource;
  agentId: string | null;
  orgId: string | null;
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
    // commissionPct = 0.15,
    commSource,
    agentId,
    orgId,
    submissionId,
  } = data;

  try {
    validateLimits(limits);
    validateDeductible(deductible);
    validateReplacementCost(replacementCost);
    validateFloodZone(floodZone);
    validateBasement(basement);
    // validateCommission(commissionPct);
    validateAALs(AALs);
    validateState(state);
  } catch (err: any) {
    let msg = err?.message || 'Provided params failed validation';
    msg = msg.replace(/(Invariant failed: )/g, 'Validation failed ');
    error('Invalid props', {
      props: data,
      userId: auth?.uid,
      function: 'calcQuote',
    });

    throw new HttpsError('failed-precondition', msg);
  }

  const commData = await getComm(commSource, orgId, agentId, 'flood');
  const commissionPct = commData.subproducerCommissionPct;

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
      ratingPropertyData: {
        floodZone: floodZone as FloodZone,
        basement: basement as Basement,
        FFH: 0,
        CBRSDesignation: null,
        distToCoastFeet: null,
        numStories: null,
        propertyCode: null,
        replacementCost: null,
        sqFootage: null,
        yearBuilt: null,
        priorLossCount: (priorLossCount as PriorLossCount) ?? null,
        units: null,
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

    return { annualPremium: result.premiumData.annualPremium, ratingDocId: ratingDocRef.id };
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
