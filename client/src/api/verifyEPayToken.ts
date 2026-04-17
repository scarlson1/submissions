// import { EPayPaymentMethodDetails } from 'common';
import type { EPayVerifiedResponse } from '@idemand/common';
import { Functions, httpsCallable } from 'firebase/functions';

export interface VerifyEPayTokenRequest {
  tokenId: string;
  accountHolder: string;
}

// TODO: type response
// export interface VerifyEPayTokenResponse extends EPayPaymentMethodDetails {
export interface VerifyEPayTokenResponse extends EPayVerifiedResponse {
  [key: string]: any;
}

export const verifyEPayToken = (
  functions: Functions,
  args: VerifyEPayTokenRequest,
) =>
  httpsCallable<VerifyEPayTokenRequest, VerifyEPayTokenResponse>(
    functions,
    'call-verifyepaytoken',
  )(args);
