import { Functions, httpsCallable } from 'firebase/functions';

// import { functions } from 'firebaseConfig';

export interface CreatePolicyRequest {
  quoteId: string;
}
export interface CreatePolicyResponse {
  policyId: string;
}

export const createPolicy = (functions: Functions, args: CreatePolicyRequest) =>
  httpsCallable<CreatePolicyRequest, CreatePolicyResponse>(functions, 'createPolicy')(args);

// export const createPolicy = httpsCallable<CreatePolicyRequest, CreatePolicyResponse>(
//   getFunctions(), // functions,
//   'createPolicy'
// );
