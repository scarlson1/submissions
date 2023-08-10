import sgMail from '@sendgrid/mail';
import { HttpsError } from 'firebase-functions/v1/auth';

import { audience } from '../../../common/environmentVars.js';
import { getReportErrorFn } from '../../../common/helpers.js';
import { CreateMsgContentProps } from '../index.js';
import { newContactMessage } from '../templates/newContactMessage.js';

export type BaseTemplateProps = Omit<CreateMsgContentProps, 'html' | 'subject'>;

export interface SendContactProps extends BaseTemplateProps {
  templateId: 'contact';
  userEmail: string;
  subject: string;
  body: any;
}

const reportErr = getReportErrorFn('sendEmail');

export async function sendContact(sgKey: string, args: SendContactProps) {
  try {
    const { userEmail, subject, body } = args;
    sgMail.setApiKey(sgKey);
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
  } catch (err: any) {
    reportErr('error sending contact us email', {}, err);

    throw new HttpsError('internal', 'failed to deliver notification');
  }
}
