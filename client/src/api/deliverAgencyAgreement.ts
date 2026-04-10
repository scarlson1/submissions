import type { Address } from '@idemand/common';
import { Functions, httpsCallable } from 'firebase/functions';

export interface DeliverAgreementRequest {
  templateId?: string;
  recipientName: string;
  email: string;
  companyName: string;
  companyAddress: Address;
}

export interface DeliverAgreementResponse {
  docId: string;
  status: string;
}

export const deliverAgencyAgreement = (
  functions: Functions,
  args: DeliverAgreementRequest,
) =>
  httpsCallable<DeliverAgreementRequest, DeliverAgreementResponse>(
    functions,
    'call-deliveragencyagreement',
  )(args);
