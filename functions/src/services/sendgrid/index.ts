import sgMail from '@sendgrid/mail';

import { submissionReceived, adminNewSubmission } from './templates';
// import { userInvite } from './emailTemplates/userInvite';
// import { emailConfirmation } from './emailTemplates/emailConfirmation';
// import { agencyAppReceived } from './emailTemplates/agencyAppReceived';
// import { agencyAppAdminNotification } from './emailTemplates/agencyAppAdminNotification';
// import { agencyAppApproved } from './emailTemplates/agencyAppApproved';

export interface CreateMsgContentProps {
  to: string | string[];
  subject: string;
  html: string;
}

const createMsgContent = ({ to, subject, html }: CreateMsgContentProps) => {
  if (process.env.AUDIENCE === 'LOCAL HUMANS') {
    to = 'spencercarlson@mac.com';
  }
  return {
    to,
    from: 'Hello@idemandinsurance.com',
    subject,
    html,
  };
};

export const sendSubmissionRecievedConfirmation = async (
  key: string,
  to: string | string[],
  toName: string | undefined | null,
  addressLine1: string
) => {
  const html = submissionReceived({ toName: toName, addressLine1 });
  sgMail.setApiKey(key);

  await sgMail.send(createMsgContent({ html, subject: `We've received your submission!`, to }));
};

export const sendNewSubmissionAdminNotification = async (
  key: string,
  link: string,
  addressLine1: string,
  city: string,
  state: string,
  to: string | string[]
) => {
  const html = adminNewSubmission({ link, addressLine1, city, state });
  sgMail.setApiKey(key);

  await sgMail.send(createMsgContent({ html, subject: `New submission!`, to }));
};
