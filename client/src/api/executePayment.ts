import { Functions, httpsCallable } from 'firebase/functions';

export interface ExecutePmtRequest {
  policyId: string;
  paymentMethodId: string;
}

export interface ExecutePmtResponse {
  transactionId: string;
  status: string;
}

export const executePayment = (functions: Functions, args: ExecutePmtRequest) =>
  httpsCallable<ExecutePmtRequest, ExecutePmtResponse>(
    functions,
    'call-executepayment',
  )(args);
