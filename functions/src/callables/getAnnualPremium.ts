import { GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import {
  Coordinates,
  Optional,
  defaultFloodZone,
  ratingDataCollection,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common/index.js';
import {
  GetAALRes,
  GetPremiumCalcResult,
  getAALs,
  getComm,
  getPremium,
  validateAALs,
  validateBasement,
  validateFloodZone,
  validateGetAALsProps,
  validatePriorLossCount,
} from '../modules/rating/index.js';
// import { GetAALRes } from '../modules/rating/getAALs';
// import { GetPremiumCalcResult } from '../modules/rating/getPremium';
import {
  Basement,
  CommSource,
  FloodZone,
  Limits,
  PriorLossCount,
  ValueByRiskType,
} from '@idemand/common';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireIDemandAdminClaims } from './utils/index.js';

// only called from quote stage --> create quote in draft state ?? pass quoteId ??
// instead of passing data ??

interface GetAnnualPremiumRequest {
  coordinates: Coordinates;
  replacementCost: number;
  limits: Limits;
  deductible: number;
  numStories: number;
  priorLossCount: string;
  state: string;
  floodZone?: string;
  basement?: string;
  // commissionPct?: number;
  submissionId?: string | null;
  locationId?: string | null;
  externalId?: string | null;
  commSource: CommSource;
  orgId?: string | null;
  agentId?: string | null;
}

export interface GetAnnualPremiumResponse {
  annualPremium: number;
  AALs: ValueByRiskType;
  ratingDocId?: string;
}

const getAnnualPremium = async ({ data, auth }: CallableRequest<GetAnnualPremiumRequest>) => {
  const db = getFirestore();
  info('GET ANNUAL PREMIUM CALLED', data);

  requireIDemandAdminClaims(auth?.token);

  const {
    coordinates,
    limits,
    deductible,
    replacementCost,
    numStories,
    priorLossCount,
    floodZone = defaultFloodZone.value(),
    state,
    basement = 'unknown',
    // commissionPct = 0.15,
    submissionId,
    locationId = null,
    externalId = null,
    commSource,
    orgId,
    agentId,
  } = data;

  try {
    // VALIDATE SWISS RE PROPS
    validateGetAALsProps(data);

    // VALIDATE NON-SWISS RE PROPS (premium calc)
    validatePriorLossCount(priorLossCount);
    validateFloodZone(floodZone);
    validateBasement(basement);
    // validateCommission(commissionPct);
  } catch (err: any) {
    error('INVALID PROPS: ', { err });
    const msg = err?.message || 'request body validation failed';

    throw new HttpsError('failed-precondition', msg);
  }

  const commData = await getComm(commSource, orgId, agentId, 'flood');
  const commissionPct = commData.subproducerCommissionPct;

  let AALsRes: GetAALRes | undefined;
  try {
    AALsRes = await getAALs({
      srClientId: swissReClientId.value(),
      srClientSecret: swissReClientSecret.value(),
      srSubKey: swissReSubscriptionKey.value(),
      replacementCost,
      limits,
      deductible,
      coordinates,
      numStories,
    });
    // TODO: save to SR collection (see getSubmissionAAL)
  } catch (err: any) {
    error('ERROR GETTING AALs: ', { err });

    throw new HttpsError('internal', 'Error fetching Average Annual Loss');
  }
  validateAALs(AALsRes.AALs);

  let result: GetPremiumCalcResult | undefined;
  try {
    result = getPremium({
      AALs: AALsRes.AALs,
      limits,
      floodZone,
      state,
      basement,
      priorLossCount,
      commissionPct,
    });

    const { premiumData } = result;
    // TODO: update original submission ??
    info(`PREMIUM: ${premiumData.annualPremium}`);

    if (
      !premiumData.annualPremium ||
      typeof premiumData.annualPremium !== 'number' ||
      premiumData.annualPremium < 100
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

  let res: Optional<GetAnnualPremiumResponse> = {
    annualPremium: result.premiumData.annualPremium,
    AALs: AALsRes.AALs as ValueByRiskType,
  };

  try {
    const ratingColRef = ratingDataCollection(db);
    const ratingDocRef = await ratingColRef.add({
      submissionId: submissionId || null,
      locationId,
      externalId,
      deductible: deductible,
      limits,
      TIV: result.tiv,
      RCVs: {
        building: AALsRes.RCVs.building,
        otherStructures: AALsRes.RCVs.otherStructures,
        contents: AALsRes.RCVs.contents,
        BI: AALsRes.RCVs.BI,
        total: AALsRes.RCVs.total,
      },
      ratingPropertyData: {
        replacementCost,
        basement: basement as Basement, // TODO: zod parse
        floodZone: floodZone as FloodZone,
        numStories,
        propertyCode: null,
        CBRSDesignation: null,
        distToCoastFeet: null,
        sqFootage: null,
        yearBuilt: null,
        FFH: null,
        priorLossCount: (priorLossCount as PriorLossCount) ?? null,
        units: null,
      },
      AALs: AALsRes.AALs,
      premiumCalcData: result.premiumData,
      PM: result.pm,
      riskScore: result.riskScore,
      stateMultipliers: result.stateMultipliers,
      secondaryFactorMults: result.secondaryFactorMults,
      coordinates: new GeoPoint(coordinates.latitude, coordinates.longitude),
      address: null,
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    });

    res.ratingDocId = ratingDocRef.id;
  } catch (err) {
    error('ERROR SAVING RATING DOC ', { err });
  }

  return res;
};

export default onCallWrapper<GetAnnualPremiumRequest>('getAnnualPremium', getAnnualPremium);
