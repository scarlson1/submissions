import { Functions, httpsCallable } from 'firebase/functions';

export interface SendNewQuoteEmailRequest {
  emails: string[];
  quoteId: string;
}
export interface SendNewQuoteEmailResponse {
  emails: string[];
}

export const sendNewQuoteNotifications = (functions: Functions, args: SendNewQuoteEmailRequest) =>
  httpsCallable<SendNewQuoteEmailRequest, SendNewQuoteEmailResponse>(
    functions,
    'sendnewquotenotifications'
  )(args);
