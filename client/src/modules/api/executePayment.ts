import { httpsCallable } from 'firebase/functions';

import { functions } from 'firebaseConfig';

export interface ExecutePmtRequest {
  policyId: string;
  paymentMethodId: string;
}

export interface ExecutePmtResponse {
  transactionId: string;
  status: string;
}

export const executePayment = httpsCallable<ExecutePmtRequest, ExecutePmtResponse>(
  functions,
  'executePayment'
);
