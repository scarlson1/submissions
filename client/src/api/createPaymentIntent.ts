import { Functions, httpsCallable } from 'firebase/functions';

export interface CreatePaymentIntentRequest {
  docId: string; // quoteId
}
export interface CreatePaymentIntentResponse {
  clientSecret: string;
}

export const createPaymentIntent = (functions: Functions, args: CreatePaymentIntentRequest) =>
  httpsCallable<CreatePaymentIntentRequest, CreatePaymentIntentResponse>(
    functions,
    'createpaymentintent'
  )(args);
