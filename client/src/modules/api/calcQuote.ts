import { httpsCallable } from 'firebase/functions';

import { functions } from 'firebaseConfig';

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
  submissionId: string;
  basement?: string;
  commissionPct?: number;
}

export interface CalcQuoteResponse {
  annualPremium: number;
}

export const calcQuote = httpsCallable<CalcQuoteRequest, CalcQuoteResponse>(functions, 'calcQuote');
