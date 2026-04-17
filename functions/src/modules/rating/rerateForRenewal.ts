import { Firestore, GeoPoint, Timestamp } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';

import {
  ILocation,
  // type RCVs as RCVsType,
  RCVs,
  type ValueByRiskType,
  ValueByRiskType as ValueByRiskTypeZ,
} from '@idemand/common';
import { ratingDataCollection } from '../../common/index.js';
import { GetAALRes, getAALsWithRCVs } from './getAALs.js';
import { getGetPremProps, getPremium } from './getPremium.js';

export interface RerateForRenewalProps {
  db: Firestore;
  location: ILocation;
  commissionPct: number;
  srClientId: string;
  srClientSecret: string;
  srSubKey: string;
}

export interface RerateForRenewalResult {
  annualPremium: number;
  ratingDocId: string;
}

/**
 * Re-rates a location against Swiss Re for renewal pricing (Option B).
 *
 * Uses the RCVs already stored on the prior ratingData document to call Swiss Re,
 * bypassing the need for the raw replacementCost (which `calcQuote` does not persist).
 * Returns a fresh annualPremium and a new ratingData document ID.
 */
export const rerateForRenewal = async ({
  db,
  location,
  commissionPct,
  srClientId,
  srClientSecret,
  srSubKey,
}: RerateForRenewalProps): Promise<RerateForRenewalResult> => {
  const {
    ratingDocId: priorRatingDocId,
    limits,
    deductible,
    coordinates,
    ratingPropertyData,
  } = location;

  // ── Fetch prior ratingData to get stored RCVs ─────────────────────────────
  const ratingDataCol = ratingDataCollection(db);

  let priorRCVs: RCVs | null = null; // Optional<RCVs> | null = null;
  let numStories = 1;

  if (priorRatingDocId) {
    try {
      const snap = await ratingDataCol.doc(priorRatingDocId).get();
      if (snap.exists) {
        const priorData = snap.data();
        priorRCVs = priorData?.RCVs ?? null;
        numStories = priorData?.ratingPropertyData?.numStories ?? 1;
      }
    } catch (err) {
      error('rerateForRenewal: failed to fetch prior ratingData', {
        priorRatingDocId,
        err,
      });
    }
  }

  // Fall back to numStories from the location's ratingPropertyData
  if (!numStories && ratingPropertyData?.numStories) {
    numStories = ratingPropertyData.numStories;
  }

  if (!priorRCVs || !priorRCVs.total) {
    throw new Error(
      `rerateForRenewal: no usable RCVs found on prior ratingData (${priorRatingDocId}). Cannot re-rate without RCVs.`,
    );
  }

  info('rerateForRenewal: fetched prior RCVs', { priorRCVs, numStories });

  // ── Call Swiss Re with the prior RCVs ─────────────────────────────────────
  let aalRes: GetAALRes;
  try {
    aalRes = await getAALsWithRCVs({
      srClientId,
      srClientSecret,
      srSubKey,
      RCVs: priorRCVs,
      limits,
      deductible,
      coordinates,
      numStories,
    });
  } catch (err: any) {
    throw new Error(
      `rerateForRenewal: Swiss Re call failed — ${err?.message || err}`,
    );
  }

  // TODO: too strick of validation?
  // unsure API always returns all types ??
  const AALs = ValueByRiskTypeZ.parse(aalRes.AALs);

  // ── Calculate premium ─────────────────────────────────────────────────────
  // const premProps = getGetPremProps(location, limits, aalRes.AALs, commissionPct);
  const premProps = getGetPremProps(location, limits, AALs, commissionPct);
  const result = getPremium(premProps);

  info('rerateForRenewal: premium calculated', {
    annualPremium: result.premiumData.annualPremium,
  });

  // ── Persist new ratingData doc ────────────────────────────────────────────
  const newRatingDocRef = await ratingDataCol.add({
    submissionId: null,
    locationId: null,
    externalId: null,
    limits,
    deductible,
    TIV: result.tiv,
    RCVs: aalRes.RCVs,
    ratingPropertyData: {
      replacementCost: null,
      basement: ratingPropertyData?.basement ?? null,
      floodZone: ratingPropertyData?.floodZone ?? null,
      numStories,
      propertyCode: null,
      CBRSDesignation: null,
      distToCoastFeet: null,
      sqFootage: null,
      yearBuilt: null,
      FFH: ratingPropertyData?.FFH ?? null,
      priorLossCount: ratingPropertyData?.priorLossCount ?? null,
      units: null,
    },
    AALs: aalRes.AALs as ValueByRiskType,
    PM: result.pm,
    riskScore: result.riskScore,
    stateMultipliers: result.stateMultipliers,
    secondaryFactorMults: result.secondaryFactorMults,
    premiumCalcData: result.premiumData,
    coordinates: coordinates
      ? new GeoPoint(coordinates.latitude, coordinates.longitude)
      : null,
    address: null,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  });

  return {
    annualPremium: result.premiumData.annualPremium,
    ratingDocId: newRatingDocRef.id,
  };
};
