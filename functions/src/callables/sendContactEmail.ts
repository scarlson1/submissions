import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import { Resend } from 'resend';
import { adminNotificationEmail, resendKey } from '../common/index.js';
import { newContactMessage } from '../services/sendgrid/templates/index.js';
import { onCallWrapper } from '../services/sentry/index.js';

// TODO: delete ?? use sendEmail

interface SendContactEmailProps {
  userEmail: string;
  subject: string;
  body: any;
}

const sendContactEmail = async ({
  data,
  auth,
}: CallableRequest<SendContactEmailProps>) => {
  info('data: ', data);
  info('User ID: ', auth?.uid);
  const { userEmail, subject, body } = data;
  if (!userEmail || !body) {
    throw new HttpsError('invalid-argument', 'Missing email or body');
  }

  try {
    // sgMail.setApiKey(resendKey.value());
    const html = newContactMessage({
      toName: 'Admin',
      fromEmail: userEmail,
      body,
    });

    const to = [adminNotificationEmail.value()];
    // if (audience.value() !== 'LOCAL HUMANS') to.push('noreply@s-carlson.com');

    const resend = new Resend(resendKey.value());

    const { data, error } = await resend.emails.send({
      from: 'iDemand Insurance <noreply@s-carlson.com>',
      to,
      subject: `New contact us submission: ${subject}`,
      html,
      tags: [
        {
          name: 'emailType',
          value: 'contact',
        },
      ],
    });

    // TODO: optional cc emails
    // await sgMail.send({
    //   html,
    //   subject: `New contact us submission: ${subject}`,
    //   to,
    //   from: 'noreply@s-carlson.com',
    //   // customArgs: {
    //   //   emailType: 'contact',
    //   // },
    // });

    return {
      emails: [userEmail],
      data,
      error,
    };
  } catch (err) {
    error('ERROR SENDING "CONTACT US" EMAIL: ', { err });
    throw new HttpsError('internal', 'Failed to deliver email.');
  }
};

export default onCallWrapper<SendContactEmailProps>(
  'sendcontactemail',
  sendContactEmail,
);
