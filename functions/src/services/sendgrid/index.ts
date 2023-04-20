import sgMail, { MailDataRequired } from '@sendgrid/mail';

// TODO: https://docs.sendgrid.com/for-developers/sending-email/personalizations
// TODO: switch to dynamic templates
// dynamic templates ref: https://docs.sendgrid.com/for-developers/sending-email/using-handlebars#password-reset
// categorize (action: password reset, confirm email, etc.; receipt: new policy, policy renewal, etc.; )

// dynamic templates nodejs lib implementation: https://stackoverflow.com/a/68423849

// TODO: error handling: https://docs.sendgrid.com/api-reference/mail-send/errors

// API DOCS: https://docs.sendgrid.com/api-reference/mail-send/mail-send

import {
  submissionReceived,
  adminNewSubmission,
  emailConfirmation,
  userInvite,
  adminNewAgencySubmission,
  newQuote,
  adminPaymentReceived,
  policyDelivery,
  agencyAppApproved,
  adminPolicyImportNotification,
} from './templates';

export interface AttachmentJSON {
  content: string;
  filename: string;
  type?: string;
  disposition?: string;
  content_id?: string;
}

export interface CreateMsgContentProps {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: AttachmentJSON[];
}

// pathToAttachment = `${__dirname}/attachment.pdf`;
// attachment = fs.readFileSync(pathToAttachment).toString('base64');

// attachments: [
//   {
//     content: attachment,
//     filename: 'attachment.pdf',
//     type: 'application/pdf',
//     disposition: 'attachment',
//   },
// ];

const createMsgContent = ({
  to,
  subject,
  html,
  attachments,
}: CreateMsgContentProps): MailDataRequired => {
  // if (process.env.AUDIENCE === 'LOCAL HUMANS') {
  //   to = 'spencercarlson@mac.com';
  // }
  return {
    to,
    from: 'Hello@idemandinsurance.com',
    subject,
    html,
    attachments,
  };
};

export const sendSubmissionRecievedConfirmation = async (
  key: string,
  createAccountLink: string,
  to: string | string[],
  toName: string | undefined | null,
  addressLine1: string
) => {
  const html = submissionReceived({ toName: toName, addressLine1, createAccountLink });
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

export const sendEmailConfirmation = async (
  key: string,
  link: string,
  to: string | string[],
  toName?: string
) => {
  const html = emailConfirmation({ toName, link });
  sgMail.setApiKey(key);

  await sgMail.send(createMsgContent({ html, subject: 'Please confirm your email', to }));
};

export const sendUserInvite = async (
  key: string,
  link: string,
  to: string | string[],
  toName: string | null | undefined = undefined,
  fromName: string | null | undefined = undefined
) => {
  const html = userInvite({ toName, fromName, link });
  sgMail.setApiKey(key);

  await sgMail
    // .sendMultiple(msg)
    .send(createMsgContent({ html, subject: 'Create an account', to }));
};

export const sendNewAgencySubmissionAdminNotification = async (
  key: string,
  link: string,
  orgName: string,
  to: string | string[]
) => {
  const html = adminNewAgencySubmission({ link, orgName });
  sgMail.setApiKey(key);

  await sgMail.send(createMsgContent({ html, subject: `New submission!`, to }));
};

export const sendNewQuoteEmail = async (
  key: string,
  link: string,
  to: string | string[],
  addressLine1?: string,
  toName?: string
) => {
  const html = newQuote({ link, toName, addressLine1 });
  sgMail.setApiKey(key);

  await sgMail.send(createMsgContent({ html, subject: `Here's your quote!`, to }));
};

export const sendPolicyDocDelivery = async (
  sgKey: string,
  to: string | string[],
  attachments: AttachmentJSON[],
  toName?: string,
  addressName?: string
) => {
  const html = policyDelivery({ toName, addressName });
  sgMail.setApiKey(sgKey);

  await sgMail.send(
    createMsgContent({ html, subject: `Congrats! Here's your new policy`, to, attachments })
  );
};

export const sendAdminPaidNotification = async (
  sgKey: string,
  to: string | string[],
  policyLink: string,
  policyId: string,
  transactionLink: string,
  transactionId: string
) => {
  const html = adminPaymentReceived({ policyLink, policyId, transactionLink, transactionId });
  sgMail.setApiKey(sgKey);

  await sgMail.send(createMsgContent({ html, subject: `Payment received (${transactionId})`, to }));
};

export const sendAgencyAppApprovedNotification = async (
  key: string,
  tenantId: string,
  orgName: string,
  email: string,
  to: string | string[],
  firstName?: string,
  lastName?: string
) => {
  const link = `${process.env.HOSTING_BASE_URL}/auth/create-account/${encodeURIComponent(
    tenantId
  )}?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(
    firstName || ''
  )}&lastName=${encodeURIComponent(lastName || '')}`;

  const html = agencyAppApproved({ firstName, orgName, link });

  sgMail.setApiKey(key);

  // const to = [email];
  // if (process.env.AUDIENCE === 'Local Humans') {
  //   to.push('spencer.carlson@idemandinsurance.com');
  // }

  await sgMail.send(
    createMsgContent({
      to,
      html,
      subject: 'Finish setting up your account',
    })
  );

  return { link };
};

// adminPolicyImportNotification

export const sendAdminPolicyImportNotification = async (
  key: string,
  to: string | string[],
  successCount: number,
  errorCount: number,
  invalidDataCount: number,
  fileName: string,
  link?: string | null | undefined,
  toName?: string
) => {
  const html = adminPolicyImportNotification({
    successCount,
    errorCount,
    invalidDataCount,
    fileName,
    link,
    toName,
  });

  sgMail.setApiKey(key);
  await sgMail.send(
    createMsgContent({
      to,
      html,
      subject: 'Policy import complete',
    })
  );
};
