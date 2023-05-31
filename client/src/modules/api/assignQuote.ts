import { Functions, httpsCallable } from 'firebase/functions';

// import { functions } from 'firebaseConfig';

export interface AssignQuoteRequest {
  quoteId: string;
}

export interface AssignQuoteResponse {
  message: string;
}

export const assignQuote = (functions: Functions, args: AssignQuoteRequest) =>
  httpsCallable<AssignQuoteRequest, AssignQuoteResponse>(functions, 'assignquote')(args);

// export const assignQuote = httpsCallable<AssignQuoteRequest, AssignQuoteResponse>(
//   getFunctions(), // functions,
//   'assignQuote'
// );
