import sgMail from '@sendgrid/mail';
import { HttpsError } from 'firebase-functions/v1/auth';

// import { audience } from '../../../common/environmentVars';
import { audience, getReportErrorFn } from '../../../common/index.js';
import { CreateMsgContentProps } from '../index.js';
import { newContactMessage } from '../templates/index.js'; // /newContactMessage

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
    const html = newContactMessage({
      toName: 'Admin',
      fromEmail: userEmail,
      body,
    });

    const to = ['spencer@s-carlson.com'];
    if (audience.value() !== 'LOCAL HUMANS') to.push('noreply@s-carlson.com');
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
