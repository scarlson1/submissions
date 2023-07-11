import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { error, info } from 'firebase-functions/logger';

import { sendNewQuoteEmail } from '../services/sendgrid';
import { CLAIMS, hostingBaseURL, sendgridApiKey } from '../common';
import { onCallWrapper } from '../services/sentry';

interface SendNewQuoteNotificationsProps {
  to: string | string[];
  quoteId: string;
}

const sendNewQuoteNotifications = async ({
  data,
  auth,
}: CallableRequest<SendNewQuoteNotificationsProps>) => {
  console.log('data: ', data);
  const { to, quoteId } = data;
  const token = auth?.token;

  if (!token) throw new HttpsError('unauthenticated', `must be signed in`);

  const isIDemandAdmin: boolean = token[CLAIMS.IDEMAND_ADMIN];
  const isAgentOrOrgAdmin: boolean = token[CLAIMS.AGENT] || token[CLAIMS.ORG_ADMIN];

  if (!(isIDemandAdmin || isAgentOrOrgAdmin))
    throw new HttpsError('permission-denied', `must be agent or admin`);

  if (!to || !quoteId) throw new HttpsError('failed-precondition', `missing email or body`);

  // TODO: fetch quote --> check if agent.userId matches request

  // if (emails.every(isValidEmail))
  //   throw new HttpsError(
  //     'failed-precondition',
  //     'emails must be an array of valid email addresses'
  //   );

  const sgKey = sendgridApiKey.value();
  if (!sgKey) throw new HttpsError('failed-precondition', 'missing Sendgrid api key');

  try {
    info(`SENDING QUOTE NOTIFICATIONS TO ${JSON.stringify(to)} for quote ${quoteId}`);

    const link = `${hostingBaseURL.value()}/quotes/${quoteId}`;
    await sendNewQuoteEmail(sgKey, link, to);

    return {
      status: 'success',
      emails: to,
    };
  } catch (err: any) {
    error('ERROR SENDING "New Quote Notifications" EMAIL', { err });
    let msg = `failed to deliver email`;
    if (err?.message) msg = err.message;
    throw new HttpsError('internal', msg);
  }
};

export default onCallWrapper<SendNewQuoteNotificationsProps>(
  'sendnewquotenotifications',
  sendNewQuoteNotifications
);
