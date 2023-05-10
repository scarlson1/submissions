import { Functions, httpsCallable } from 'firebase/functions';

import { ContactUsValues } from 'elements/ContactForm';

export type SendContactEmailRequest = ContactUsValues;
export interface SendContactEmailResponse {
  email: string[];
}

export const sendContactEmail = (functions: Functions, args: SendContactEmailRequest) =>
  httpsCallable<SendContactEmailRequest, SendContactEmailResponse>(
    functions,
    'sendcontactemail'
  )(args);
