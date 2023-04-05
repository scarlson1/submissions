import { Functions, httpsCallable } from 'firebase/functions';

export interface SendAgencyApprovedRequest {
  docId: string;
  tenantId: string;
}

export const sendAgencyApprovedNotification = (
  functions: Functions,
  args: SendAgencyApprovedRequest
) =>
  httpsCallable<SendAgencyApprovedRequest, { recipients: any }>(
    functions,
    'sendAgencyApprovedNotification'
  )(args);
