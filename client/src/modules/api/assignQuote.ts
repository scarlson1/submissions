import { httpsCallable } from 'firebase/functions';

import { functions } from 'firebaseConfig';

export interface AssignQuoteRequest {
  quoteId: string;
}

export interface AssignQuoteResponse {
  message: string;
}

export const assignQuote = httpsCallable<AssignQuoteRequest, AssignQuoteResponse>(
  functions,
  'assignQuote'
);
