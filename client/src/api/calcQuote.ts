import { Functions, httpsCallable } from 'firebase/functions';

import { Limits, ValueByRiskType } from 'common';

export interface CalcQuoteRequest {
  limits: Limits;
  AAL: ValueByRiskType;
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
  ratingDocId?: string;
}

export const calcQuote = (functions: Functions, args: CalcQuoteRequest) =>
  httpsCallable<CalcQuoteRequest, CalcQuoteResponse>(functions, 'calcquote')(args);
