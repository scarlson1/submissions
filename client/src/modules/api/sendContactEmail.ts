import { getFunctions, httpsCallable } from 'firebase/functions';

import { ContactUsValues } from 'elements/ContactForm';

export type SendContactEmailRequest = ContactUsValues;
export interface SendContactEmailResponse {
  email: string[];
}

const functions = getFunctions();

export const sendContactEmail = httpsCallable<SendContactEmailRequest, SendContactEmailResponse>(
  functions,
  'sendContactEmail'
);
