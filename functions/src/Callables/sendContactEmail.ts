import sgMail from '@sendgrid/mail';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import { audience, sendgridApiKey } from '../common';
import { newContactMessage } from '../services/sendgrid/templates';
import { onCallWrapper } from '../services/sentry';

interface SendContactEmailProps {
  userEmail: string;
  subject: string;
  body: any;
}

const sendContactEmail = async ({ data, auth }: CallableRequest<SendContactEmailProps>) => {
  info('data: ', data);
  info('User ID: ', auth?.uid);
  const { userEmail, subject, body } = data;
  if (!userEmail || !body) {
    throw new HttpsError('invalid-argument', `Missing email or body`);
  }

  try {
    sgMail.setApiKey(sendgridApiKey.value());
    const html = newContactMessage({ toName: 'Admin', fromEmail: userEmail, body });

    const to = ['spencer.carlson@idemandinsurance.com'];
    if (audience.value() !== 'LOCAL HUMANS') to.push('ron.carlson@idemandinsurance.com');
    // TODO: optional cc emails
    await sgMail.send({
      html,
      subject: `New contact us submission: ${subject}`,
      to,
      from: 'hello@idemandinsurance.com',
      customArgs: {
        emailType: 'contact',
      },
    });

    return {
      emails: [userEmail],
    };
  } catch (err) {
    error('ERROR SENDING "CONTACT US" EMAIL: ', { err });
    throw new HttpsError('internal', 'Failed to deliver email.');
  }
};

export default onCallWrapper<SendContactEmailProps>('sendcontactemail', sendContactEmail);
