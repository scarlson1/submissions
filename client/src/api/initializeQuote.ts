import { Functions, httpsCallable } from 'firebase/functions';

// import { functions } from 'firebaseConfig';

export type InitQuoteRequest = { quoteId: string | undefined | null };
export interface InitQuoteResponse {
  [key: string]: any;
}

export const initializeQuote = (functions: Functions, args: InitQuoteRequest) =>
  httpsCallable<InitQuoteRequest, InitQuoteResponse>(functions, 'initializequote')(args);
