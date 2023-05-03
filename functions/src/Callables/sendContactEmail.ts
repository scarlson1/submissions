import { CallableContext, HttpsError } from 'firebase-functions/v1/https';
import sgMail from '@sendgrid/mail';

import { newContactMessage } from '../services/sendgrid/templates';

// const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export default async (data: any, ctx: CallableContext) => {
  console.log('data: ', data);
  const { email, subject, body } = data;
  if (!email || !body) {
    throw new HttpsError('invalid-argument', `Missing email or body`);
  }

  try {
    if (!process.env.SENDGRID_API_KEY) throw new Error('Missing sendgrid api key');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const html = newContactMessage({ toName: 'Admin', fromEmail: email, body });

    const to = ['spencer.carlson@idemandinsurance.com'];
    if (process.env.AUDIENCE !== 'LOCAL HUMANS') to.push('ron.carlson@idemandinsurance.com');
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
