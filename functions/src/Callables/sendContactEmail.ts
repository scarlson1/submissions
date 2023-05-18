import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import sgMail from '@sendgrid/mail';

import { newContactMessage } from '../services/sendgrid/templates';
import { audience, sendgridApiKey } from '../common';

export default async ({ data }: CallableRequest) => {
  console.log('data: ', data);
  const { email, subject, body } = data;
  if (!email || !body) {
    throw new HttpsError('invalid-argument', `Missing email or body`);
  }

  try {
    sgMail.setApiKey(sendgridApiKey.value());
    const html = newContactMessage({ toName: 'Admin', fromEmail: email, body });

    const to = ['spencer.carlson@idemandinsurance.com'];
    if (audience.value() !== 'LOCAL HUMANS') to.push('ron.carlson@idemandinsurance.com');
    // TODO: optional cc emails
    await sgMail.send({
      html,
      subject: `New contact us submission: ${subject}`,
      to,
      from: 'hello@idemandinsurance.com', // email,
    });

    return {
      emails: [email],
    };
  } catch (err) {
    console.log('ERROR SENDING "CONTACT US" EMAIL: ', err);
    throw new HttpsError('internal', 'Failed to deliver email.');
  }
};
