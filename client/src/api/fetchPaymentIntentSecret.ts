import { Functions, httpsCallable } from 'firebase/functions';

export interface FetchPaymentIntentSecretRequest {
  paymentIntentId: string; // quoteId
}
export interface FetchPaymentIntentSecretResponse {
  clientSecret: string;
}

export const fetchPaymentIntentSecret = (
  functions: Functions,
  args: FetchPaymentIntentSecretRequest,
) =>
  httpsCallable<
    FetchPaymentIntentSecretRequest,
    FetchPaymentIntentSecretResponse
  >(
    functions,
    'call-fetchpaymentintentsecret',
  )(args);
