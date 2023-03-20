import { Functions, httpsCallable } from 'firebase/functions';

// import { functions } from 'firebaseConfig';

export interface SendPolicyDocRequest {
  emails: string[];
  policyId: string;
}
export interface SendPolicyDocResponse {
  status: string;
  emails: string[];
}

export const sendPolicyDoc = (functions: Functions, args: SendPolicyDocRequest) =>
  httpsCallable<SendPolicyDocRequest, SendPolicyDocResponse>(functions, 'sendPolicyDoc')(args);

// export const sendPolicyDoc = httpsCallable<SendPolicyDocRequest, SendPolicyDocResponse>(
//   getFunctions(), // functions,
//   'sendPolicyDoc'
// );
