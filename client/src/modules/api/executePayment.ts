import { Functions, httpsCallable } from 'firebase/functions';

// import { functions } from 'firebaseConfig';

export interface ExecutePmtRequest {
  policyId: string;
  paymentMethodId: string;
}

export interface ExecutePmtResponse {
  transactionId: string;
  status: string;
}

export const executePayment = (functions: Functions, args: ExecutePmtRequest) =>
  httpsCallable<ExecutePmtRequest, ExecutePmtResponse>(functions, 'executePayment')(args);

// export const executePayment = httpsCallable<ExecutePmtRequest, ExecutePmtResponse>(
//   getFunctions(), // functions,
//   'executePayment'
// );
