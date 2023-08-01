import { Functions, httpsCallable } from 'firebase/functions';

import { Address } from 'common';

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

export const deliverAgencyAgreement = (functions: Functions, args: DeliverAgreementRequest) =>
  httpsCallable<DeliverAgreementRequest, DeliverAgreementResponse>(
    functions,
    'deliveragencyagreement'
  )(args);
