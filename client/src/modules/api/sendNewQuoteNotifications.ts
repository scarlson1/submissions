import { httpsCallable } from 'firebase/functions';

import { functions } from 'firebaseConfig';

export interface SendNewQuoteEmailRequest {
  emails: string[];
  quoteId: string;
}
export interface SendNewQuoteEmailResponse {
  emails: string[];
}

export const sendNewQuoteNotifications = httpsCallable<
  SendNewQuoteEmailRequest,
  SendNewQuoteEmailResponse
>(functions, 'sendNewQuoteNotifications');
