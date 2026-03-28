import { Functions, httpsCallable } from 'firebase/functions';

export interface CreatePolicyRequest {
  quoteId: string;
}
export interface CreatePolicyResponse {
  policyId: string;
  message: string;
}

export const createPolicy = (functions: Functions, args: CreatePolicyRequest) =>
  httpsCallable<CreatePolicyRequest, CreatePolicyResponse>(
    functions,
    'call-createpolicy',
  )(args);
