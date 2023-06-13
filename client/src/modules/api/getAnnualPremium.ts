import { Coordinates, Limits, ValueByRiskType } from 'common';
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
  commissionPct?: number | null;
}

// export interface GetAnnualPremiumRequest extends RatingInputs {
export interface GetAnnualPremiumRequest {
  // latitude: number;
  // longitude: number;
  coordinates: Coordinates;
  replacementCost: number;
  limits: Limits;
  deductible: number;
  numStories?: number;
  priorLossCount: string;
  state: string;
  floodZone?: string | null;
  basement?: string | null;
  commissionPct?: number | null;
  submissionId?: string | null;
  locationId?: string | null;
  externalId?: string | null;
}

export interface GetAnnualPremiumResponse {
  annualPremium: number;
  AAL: ValueByRiskType;
  // inlandAAL: number;
  // surgeAAL: number;
}

export const getAnnualPremium = (functions: Functions, args: GetAnnualPremiumRequest) =>
  httpsCallable<GetAnnualPremiumRequest, GetAnnualPremiumResponse>(
    functions,
    'getannualpremium'
  )(args);
