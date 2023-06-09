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
  floodZone?: string;
  basement?: string;
  commissionPct?: number;
}

export interface GetAnnualPremiumRequest extends RatingInputs {
  submissionId?: string | null;
}

export interface GetAnnualPremiumResponse {
  // data: { annualPremium: number };
  annualPremium: number;
  inlandAAL: number;
  surgeAAL: number;
}

export const getAnnualPremium = (functions: Functions, args: GetAnnualPremiumRequest) =>
  httpsCallable<GetAnnualPremiumRequest, GetAnnualPremiumResponse>(
    functions,
    'getannualpremium'
  )(args);
