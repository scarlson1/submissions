import { Functions, httpsCallable } from 'firebase/functions';

export interface SendPolicyDocRequest {
  emails: string[];
  policyId: string;
}
export interface SendPolicyDocResponse {
  status: string;
  emails: string[];
}

export const sendPolicyDoc = (functions: Functions, args: SendPolicyDocRequest) =>
  httpsCallable<SendPolicyDocRequest, SendPolicyDocResponse>(functions, 'sendpolicydoc')(args);
