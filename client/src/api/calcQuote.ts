import { Functions, httpsCallable } from 'firebase/functions';

import type { CommSource, Limits } from '@idemand/common';
import { ValueByRiskType } from 'common';

export interface CalcQuoteRequest {
  limits: Limits;
  AALs: ValueByRiskType;
  replacementCost: number;
  deductible: number;
  state: string;
  floodZone: string;
  priorLossCount: string;
  submissionId?: string | null;
  basement?: string;
  // commissionPct?: number;
  commSource: CommSource;
  agentId: string | null;
  orgId: string | null;
}

export interface CalcQuoteResponse {
  annualPremium: number;
  ratingDocId?: string;
}

export const calcQuote = (functions: Functions, args: CalcQuoteRequest) =>
  httpsCallable<CalcQuoteRequest, CalcQuoteResponse>(
    functions,
    'call-calcquote',
  )(args);
