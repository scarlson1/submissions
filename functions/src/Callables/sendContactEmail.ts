import * as functions from 'firebase-functions';
// import { getFirestore } from 'firebase-admin/firestore'; // Timestamp, FieldValue
import { defineSecret } from 'firebase-functions/params';
import sgMail from '@sendgrid/mail';

import { newContactMessage } from '../services/sendgrid/templates';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export const sendContactEmail = functions
  .runWith({
    secrets: [sendgridApiKey],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data) => {
    console.log('data: ', data);
    const { email, subject, body } = data;
    if (!email || !body) {
      throw new functions.https.HttpsError('invalid-argument', `Missing email or body`);
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
      throw new functions.https.HttpsError('internal', 'Failed to deliver email.');
    }
  });
