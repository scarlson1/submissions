import { Functions, httpsCallable } from 'firebase/functions';

export interface GetAnnualPremiumRequest {
  lat: number;
  lng: number;
  rcvA: number;
  rcvB: number;
  rcvC: number;
  rcvD: number;
  limitA: number;
  limitB: number;
  limitC: number;
  limitD: number;
  deductible: number;
  numStories?: number;
  priorLossCount: string; // number;
  submissionId?: string | null;
  state: string;
  floodZone?: string;
  basement?: string;
  commissionPct?: number;
}

export interface GetAnnualPremiumResponse {
  // data: { annualPremium: number };
  annualPremium: number;
}

export const getAnnualPremium = (functions: Functions, args: GetAnnualPremiumRequest) =>
  httpsCallable<GetAnnualPremiumRequest, GetAnnualPremiumResponse>(
    functions,
    'getAnnualPremium'
  )(args);

// export const calcQuote = httpsCallable<CalcQuoteRequest, CalcQuoteResponse>(
//   getFunctions(),
//   'calcQuote'
// );
