import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { error, info } from 'firebase-functions/logger';
import { GeoPoint, Timestamp, getFirestore } from 'firebase-admin/firestore';
import invariant from 'tiny-invariant';

import {
  CLAIMS,
  Coordinates,
  Limits,
  Optional,
  ValueByRiskType,
  defaultFloodZone,
  ratingDataCollection,
} from '../common';
import { getAALs, validateGetAALsProps } from '../utils/rating';
import { getPremium } from '../utils/rating';
import { swissReClientId, swissReClientSecret, swissReSubscriptionKey } from '../common';
import { GetPremiumCalcResult } from '../utils/rating/getPremium';
import { GetAALRes } from '../utils/rating/getAALs';

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
  commissionPct?: number;
  submissionId?: string | null;
  locationId?: string | null;
  externalId?: string | null;
}

export interface GetAnnualPremiumResponse {
  annualPremium: number;
  AAL: ValueByRiskType;
  ratingDocId?: string;
}

export default async ({ data, auth }: CallableRequest<GetAnnualPremiumRequest>) => {
  const db = getFirestore();
  info('GET ANNUAL PREMIUM CALLED', data);

  if (!(auth && auth.uid && auth?.token[CLAIMS['IDEMAND_ADMIN']])) {
    throw new HttpsError('permission-denied', `${CLAIMS['IDEMAND_ADMIN']} permissions required`);
  }

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
    error('INVALID PROPS: ', { err });
    let msg = 'request body validation failed';
    if (err?.message) msg = err.message.replace('Invariant failed: ', '');

    throw new HttpsError('failed-precondition', msg);
  }

  let AALsRes: GetAALRes | undefined;
  try {
    const srClientId = swissReClientId.value();
    const srClientSecret = swissReClientSecret.value();
    const srSubKey = swissReSubscriptionKey.value();

    AALsRes = await getAALs({
      srClientId,
      srClientSecret,
      srSubKey,
      replacementCost,
      limits,
      deductible,
      coordinates,
      numStories,
    });
    // TODO: save to SR collection (see getSubmissionAAL)
  } catch (err: any) {
    console.log('ERROR GETTING AALs: ', err);

    throw new HttpsError('internal', 'Error fetching Average Anuual Loss');
  }

  invariant(typeof AALsRes?.AAL?.inland === 'number', 'Missing inland AAL');
  invariant(typeof AALsRes?.AAL?.surge === 'number', 'Missing surge AAL');
  invariant(typeof AALsRes?.AAL?.tsunami === 'number', 'Missing tsunami AAL');

  let result: GetPremiumCalcResult | undefined;
  try {
    result = getPremium({
      AAL: {
        inland: AALsRes.AAL.inland,
        surge: AALsRes.AAL.surge,
        tsunami: AALsRes.AAL.tsunami,
      },
      limits,
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

  let res: Optional<GetAnnualPremiumResponse> = {
    annualPremium: result.premiumData.directWrittenPremium,
    AAL: AALsRes.AAL as ValueByRiskType,
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
        building: AALsRes.rcvs.building,
        otherStructures: AALsRes.rcvs.otherStructures,
        contents: AALsRes.rcvs.contents,
        BI: AALsRes.rcvs.BI,
        total: AALsRes.rcvs.total,
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
        FFH: null,
        priorLossCount: priorLossCount ?? null,
      },
      AAL: AALsRes.AAL,
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
    console.log('ERROR SAVING RATING DOC: ', err);
  }

  return res;
};
