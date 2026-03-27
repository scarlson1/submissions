import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import { CLAIMS, hostingBaseURL, resendKey } from '../common/index.js';
import { sendNewQuoteEmail } from '../services/sendgrid/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { onlyUnique } from '../utils/arrays.js';

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

  if (!token) throw new HttpsError('unauthenticated', 'must be signed in');

  const isIDemandAdmin: boolean = token[CLAIMS.IDEMAND_ADMIN];
  const isAgentOrOrgAdmin: boolean =
    token[CLAIMS.AGENT] || token[CLAIMS.ORG_ADMIN];

  if (!(isIDemandAdmin || isAgentOrOrgAdmin))
    throw new HttpsError('permission-denied', 'must be agent or admin');

  if (!to || !quoteId)
    throw new HttpsError('failed-precondition', 'missing email or body');

  // TODO: fetch quote --> check if agent.userId matches request

  // if (emails.every(isValidEmail))
  //   throw new HttpsError(
  //     'failed-precondition',
  //     'emails must be an array of valid email addresses'
  //   );

  const key = resendKey.value();
  if (!key)
    throw new HttpsError('failed-precondition', 'missing Sendgrid api key');

  // TODO: delete ?? handled in sendgrid/index.ts ??
  const uniqueTo = Array.isArray(to) ? to.filter(onlyUnique) : to;

  try {
    const link = `${hostingBaseURL.value()}/quotes/${quoteId}`;
    info(
      `SENDING QUOTE NOTIFICATIONS TO ${JSON.stringify(uniqueTo)} for quote ${quoteId}`,
      {
        ...data,
        uniqueTo,
        link,
      },
    );

    await sendNewQuoteEmail(key, link, uniqueTo, undefined, undefined);

    return {
      status: 'success',
      emails: uniqueTo,
    };
  } catch (err: unknown) {
    error('ERROR SENDING "New Quote Notifications" EMAIL', { err });
    let msg = 'failed to deliver email';
    if (err instanceof Error) msg = err.message;
    throw new HttpsError('internal', msg);
  }
};

export default onCallWrapper<SendNewQuoteNotificationsProps>(
  'sendnewquotenotifications',
  sendNewQuoteNotifications,
);
