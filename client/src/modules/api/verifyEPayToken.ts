import { EPayPaymentMethodDetails } from 'common';
import { httpsCallable } from 'firebase/functions';

import { functions } from 'firebaseConfig';

export interface VerifyEPayTokenRequest {
  tokenId: string;
  accountHolder: string;
}
export interface VerifyEPayTokenResponse extends EPayPaymentMethodDetails {
  [key: string]: any;
}

export const verifyEPayToken = httpsCallable<VerifyEPayTokenRequest, VerifyEPayTokenResponse>(
  functions,
  'verifyEPayToken'
);
