import { httpsCallable } from 'firebase/functions';
import { functions } from 'firebaseConfig';

export type InitQuoteRequest = { quoteId: string | undefined | null };
export interface InitQuoteResponse {
  [key: string]: any;
}

// export const initializeQuote = (functions: Functions) =>
//   httpsCallable<InitQuoteRequest, InitQuoteResponse>(functions, 'initializeQuote');

export const initializeQuote = httpsCallable<InitQuoteRequest, InitQuoteResponse>(
  functions,
  'initializeQuote'
);
