import { Functions, httpsCallable } from 'firebase/functions';

// import { functions } from 'firebaseConfig';

export interface CalcQuoteRequest {
  limitA: number;
  limitB: number;
  limitC: number;
  limitD: number;
  inlandAAL: number;
  surgeAAL: number;
  replacementCost: number;
  deductible: number;
  state: string;
  floodZone: string;
  priorLossCount: string;
  submissionId?: string | null;
  basement?: string;
  commissionPct?: number;
}

export interface CalcQuoteResponse {
  annualPremium: number;
}

export const calcQuote = (functions: Functions, args: CalcQuoteRequest) =>
  httpsCallable<CalcQuoteRequest, CalcQuoteResponse>(functions, 'calcQuote')(args);

// export const calcQuote = httpsCallable<CalcQuoteRequest, CalcQuoteResponse>(
//   getFunctions(),
//   'calcQuote'
// );
