import type { Coords } from '@idemand/common';
import { Limits, TCommSource, ValueByRiskType } from 'common';
import { Functions, httpsCallable } from 'firebase/functions';

export interface RatingInputs {
  latitude: number;
  longitude: number;
  replacementCost: number;
  limitA: number;
  limitB: number;
  limitC: number;
  limitD: number;
  deductible: number;
  numStories?: number;
  priorLossCount: string;
  state: string;
  floodZone?: string | null;
  basement?: string | null;
  commissionPct?: number | null; // pass commSource, agentId, orgId instead
  commSource: string | null;
  orgId: string | null;
  agentId: string | null;
}

// export interface GetAnnualPremiumRequest extends RatingInputs {
export interface GetAnnualPremiumRequest {
  // latitude: number;
  // longitude: number;
  coordinates: Coords;
  replacementCost: number;
  limits: Limits;
  deductible: number;
  numStories?: number;
  priorLossCount: string;
  state: string;
  floodZone?: string | null;
  basement?: string | null;
  // commissionPct?: number | null;
  commSource: TCommSource;
  orgId: string | null;
  agentId: string | null;
  submissionId?: string | null;
  locationId?: string | null;
  externalId?: string | null;
}

export interface GetAnnualPremiumResponse {
  annualPremium: number;
  AALs: ValueByRiskType;
  ratingDocId?: string;
}

export const getAnnualPremium = (
  functions: Functions,
  args: GetAnnualPremiumRequest,
) =>
  httpsCallable<GetAnnualPremiumRequest, GetAnnualPremiumResponse>(
    functions,
    'call-getannualpremium',
  )(args);
