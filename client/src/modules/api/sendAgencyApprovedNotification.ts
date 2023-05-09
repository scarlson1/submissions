import { Functions, httpsCallable } from 'firebase/functions';

export interface SendAgencyApprovedRequest {
  docId: string;
  tenantId: string;
  message?: string | null;
}

export interface SendAgencyApprovedResponse {
  recipients: any;
}

export const sendAgencyApprovedNotification = (
  functions: Functions,
  args: SendAgencyApprovedRequest
) =>
  httpsCallable<SendAgencyApprovedRequest, SendAgencyApprovedResponse>(
    functions,
    'sendAgencyApprovedNotification'
  )(args);
