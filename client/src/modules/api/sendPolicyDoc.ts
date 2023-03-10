import { httpsCallable } from 'firebase/functions';

import { functions } from 'firebaseConfig';

export interface SendPolicyDocRequest {
  emails: string[];
  policyId: string;
}
export interface SendPolicyDocResponse {
  status: string;
  emails: string[];
}

export const sendPolicyDoc = httpsCallable<SendPolicyDocRequest, SendPolicyDocResponse>(
  functions,
  'sendPolicyDoc'
);
