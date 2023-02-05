import { getFunctions, httpsCallable } from 'firebase/functions';

export type InitQuoteRequest = { quoteId: string | undefined | null };
export interface InitQuoteResponse {
  [key: string]: any;
}

const functions = getFunctions();

export const initializeQuote = httpsCallable<InitQuoteRequest, InitQuoteResponse>(
  functions,
  'initializeQuote'
);
