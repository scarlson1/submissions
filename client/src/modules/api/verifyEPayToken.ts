import { EPayPaymentMethodDetails } from 'common';
import { Functions, httpsCallable } from 'firebase/functions';

// import { functions } from 'firebaseConfig';

export interface VerifyEPayTokenRequest {
  tokenId: string;
  accountHolder: string;
}
export interface VerifyEPayTokenResponse extends EPayPaymentMethodDetails {
  [key: string]: any;
}

export const verifyEPayToken = (functions: Functions, args: VerifyEPayTokenRequest) =>
  httpsCallable<VerifyEPayTokenRequest, VerifyEPayTokenResponse>(
    functions,
    'verifyEPayToken'
  )(args);

// export const verifyEPayToken = httpsCallable<VerifyEPayTokenRequest, VerifyEPayTokenResponse>(
//   getFunctions(), // functions,
//   'verifyEPayToken'
// );
