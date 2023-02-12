import { httpsCallable } from 'firebase/functions';

import { ContactUsValues } from 'elements/ContactForm';
import { functions } from 'firebaseConfig';

export type SendContactEmailRequest = ContactUsValues;
export interface SendContactEmailResponse {
  email: string[];
}

// const functions = getFunctions();

// export const sendContactEmail = (functions: Functions) =>
//   httpsCallable<SendContactEmailRequest, SendContactEmailResponse>(functions, 'sendContactEmail');

export const sendContactEmail = httpsCallable<SendContactEmailRequest, SendContactEmailResponse>(
  functions,
  'sendContactEmail'
);
