import { Functions, httpsCallable } from 'firebase/functions';

import { ContactUsValues } from 'elements/ContactForm';
// import { functions } from 'firebaseConfig';

export type SendContactEmailRequest = ContactUsValues;
export interface SendContactEmailResponse {
  email: string[];
}

// const functions = getFunctions();

export const sendContactEmail = (functions: Functions, args: SendContactEmailRequest) =>
  httpsCallable<SendContactEmailRequest, SendContactEmailResponse>(
    functions,
    'sendContactEmail'
  )(args);

// export const sendContactEmail = httpsCallable<SendContactEmailRequest, SendContactEmailResponse>(
//   getFunctions(), // functions,
//   'sendContactEmail'
// );
