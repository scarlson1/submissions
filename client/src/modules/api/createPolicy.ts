import { httpsCallable } from 'firebase/functions';

import { functions } from 'firebaseConfig';

export interface CreatePolicyRequest {
  quoteId: string;
}
export interface CreatePolicyResponse {
  policyId: string;
}

export const createPolicy = httpsCallable<CreatePolicyRequest, CreatePolicyResponse>(
  functions,
  'createPolicy'
);
