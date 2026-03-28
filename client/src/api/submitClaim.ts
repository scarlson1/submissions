import { Functions, httpsCallable } from 'firebase/functions';

export interface SubmitClaimRequest {
  policyId: string;
  claimId: string;
}
export interface SubmitClaimResponse {
  status: string;
  message: string;
}

export const submitClaim = (functions: Functions, args: SubmitClaimRequest) =>
  httpsCallable<SubmitClaimRequest, SubmitClaimResponse>(
    functions,
    'call-submitclaim',
  )(args);
