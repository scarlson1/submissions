import * as functions from 'firebase-functions';
// import { getFirestore } from 'firebase-admin/firestore'; // Timestamp, FieldValue
import { defineSecret } from 'firebase-functions/params';
// import { isValidEmail } from '../common';

import { sendNewQuoteEmail } from '../services/sendgrid';

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export const sendNewQuoteNotifications = functions
  .runWith({
    secrets: [sendgridApiKey],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    console.log('data: ', data);
    const { emails, quoteId } = data;
    console.log('AUTH.TOKEN: ', ctx.auth?.token);
    // TODO: must be admin
    if (!ctx.auth?.token.iDemandAdmin)
      throw new functions.https.HttpsError('permission-denied', `Must be an admin`);

    if (!emails || !quoteId)
      throw new functions.https.HttpsError('invalid-argument', `Missing email or body`);

    // if (emails.every(isValidEmail))
    //   throw new functions.https.HttpsError(
    //     'failed-precondition',
    //     'emails must be an array of valid email addresses'
    //   );

    const sgKey = process.env.SENDGRID_API_KEY;
    if (!sgKey)
      throw new functions.https.HttpsError('failed-precondition', 'Missing Sendgrid api key');

    try {
      const link = `${process.env.HOSTING_BASE_URL}/quotes/${quoteId}/bind`;
      await sendNewQuoteEmail(sgKey, link, emails);

      return {
        status: 'success',
        emails,
      };
    } catch (err) {
      console.log('ERROR SENDING "CONTACT US" EMAIL: ', err);
      throw new functions.https.HttpsError('internal', 'Failed to deliver email.');
    }
  });
