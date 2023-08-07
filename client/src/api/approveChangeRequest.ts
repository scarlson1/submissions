import { Functions, httpsCallable } from 'firebase/functions';

export interface ApproveChangeRequest {
  policyId: string;
  requestId: string;
  underwriterNotes?: string;
}

export interface ApproveChangeResponse {
  status: string;
}

export const approveChangeRequest = (functions: Functions, args: ApproveChangeRequest) =>
  httpsCallable<ApproveChangeRequest, ApproveChangeResponse>(
    functions,
    'approvechangerequest'
  )(args);
