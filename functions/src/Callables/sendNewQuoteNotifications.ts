import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import { sendNewQuoteEmail } from '../services/sendgrid';
import { CLAIMS, sendgridApiKey } from '../common';

export default async ({ data, auth }: CallableRequest) => {
  console.log('data: ', data);
  const { to, quoteId } = data;
  const token = auth?.token;

  // TODO: must be admin
  if (!token || !token[CLAIMS.IDEMAND_ADMIN])
    throw new HttpsError('permission-denied', `Must be an admin`);

  if (!to || !quoteId) throw new HttpsError('invalid-argument', `Missing email or body`);

  // if (emails.every(isValidEmail))
  //   throw new HttpsError(
  //     'failed-precondition',
  //     'emails must be an array of valid email addresses'
  //   );

  const sgKey = sendgridApiKey.value(); // process.env.SENDGRID_API_KEY;
  if (!sgKey) throw new HttpsError('failed-precondition', 'Missing Sendgrid api key');

  try {
    console.log(`SENDING QUOTE NOTIFICATIONS TO ${JSON.stringify(to)} for quote ${quoteId}`);

    const link = `${process.env.HOSTING_BASE_URL}/quotes/${quoteId}`;
    await sendNewQuoteEmail(sgKey, link, to);

    return {
      status: 'success',
      emails: to,
    };
  } catch (err) {
    console.log('ERROR SENDING "New Quote Notifications" EMAIL: ', err);
    throw new HttpsError('internal', 'Failed to deliver email.');
  }
};
