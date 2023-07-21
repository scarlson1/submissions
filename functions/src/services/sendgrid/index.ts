import sgMail, { MailDataRequired } from '@sendgrid/mail';
import { MailData } from '@sendgrid/helpers/classes/mail';
import { EmailData } from '@sendgrid/helpers/classes/email-address';

// TODO: https://docs.sendgrid.com/for-developers/sending-email/personalizations
// TODO: switch to dynamic templates
// dynamic templates ref: https://docs.sendgrid.com/for-developers/sending-email/using-handlebars#password-reset
// categorize (action: password reset, confirm email, etc.; receipt: new policy, policy renewal, etc.; )

// dynamic templates nodejs lib implementation: https://stackoverflow.com/a/68423849

// TODO: error handling: https://docs.sendgrid.com/api-reference/mail-send/errors

// API DOCS: https://docs.sendgrid.com/api-reference/mail-send/mail-send

// TODO: add firebase event ID to customArgs for all requests
// Use webhook to listen to events save to DB

// TODO: add msgType to customArgs (ex: msgType: 'deliver policy')

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
  adminImportNotification,
  quoteExpiringSoon,
  blankHTML,
  adminChangeRequest,
  moveToTenantConfirmation,
} from './templates';
import { env } from '../../common';
import { projectID } from 'firebase-functions/params';

export interface AttachmentJSON {
  content: string;
  filename: string;
  type?: string;
  disposition?: string;
  content_id?: string;
}

export type EmailJSON = { name?: string; email: string };

export interface CreateMsgContentProps extends Omit<MailData, 'from'> {
  to: EmailData | EmailData[];
  from?: EmailData;
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
  from = { name: 'iDemand Insurance', email: 'Hello@idemandinsurance.com' },
  subject,
  html,
  attachments,
  ...rest
}: CreateMsgContentProps): MailDataRequired => {
  return {
    to,
    from,
    subject,
    html,
    attachments,
    ...rest,
  };
};

export interface ExtraSendGridArgs
  extends Omit<CreateMsgContentProps, 'to' | 'from' | 'subject' | 'html' | 'attachements'> {}

function getCustomArgs(args?: Record<string, any> | undefined) {
  return {
    projectId: projectID.value(),
    environment: env.value(),
    ...(args || {}),
  };
}

export const sendSubmissionRecievedConfirmation = async (
  key: string,
  createAccountLink: string,
  to: string | string[],
  toName: string | undefined | null,
  addressLine1: string,
  sgArgs?: ExtraSendGridArgs
) => {
  const html = submissionReceived({ toName: toName, addressLine1, createAccountLink });
  sgMail.setApiKey(key);

  await sgMail.send(
    createMsgContent({
      html,
      subject: `We've received your submission!`,
      to,
      ...getCustomArgs(sgArgs),
    })
  );
};

export const sendNewSubmissionAdminNotification = async (
  key: string,
  link: string,
  addressLine1: string,
  city: string,
  state: string,
  to: string | string[],
  sgArgs?: ExtraSendGridArgs
) => {
  const html = adminNewSubmission({ link, addressLine1, city, state });
  sgMail.setApiKey(key);

  await sgMail.send(
    createMsgContent({ html, subject: `New submission!`, to, ...getCustomArgs(sgArgs) })
  );
};

export const sendEmailConfirmation = async (
  key: string,
  link: string,
  to: string | string[],
  toName?: string,
  sgArgs?: ExtraSendGridArgs
) => {
  const html = emailConfirmation({ toName, link });
  sgMail.setApiKey(key);

  await sgMail.send(
    createMsgContent({ html, subject: 'Please confirm your email', to, ...getCustomArgs(sgArgs) })
  );
};

export const sendUserInvite = async (
  key: string,
  link: string,
  to: string | string[],
  toName: string | null | undefined = undefined,
  fromName: string | null | undefined = undefined,
  config?: Partial<CreateMsgContentProps>, // TODO: replace with sgArgs ??
  sgArgs?: ExtraSendGridArgs
) => {
  const html = userInvite({ toName, fromName, link });
  sgMail.setApiKey(key);

  await sgMail
    // .sendMultiple(msg)
    .send(
      createMsgContent({
        ...config,
        html,
        subject: 'Create an account',
        to,
        ...getCustomArgs(sgArgs),
      })
    );
};

export const sendNewAgencySubmissionAdminNotification = async (
  key: string,
  link: string,
  orgName: string,
  to: string | string[],
  sgArgs?: ExtraSendGridArgs
) => {
  const html = adminNewAgencySubmission({ link, orgName });
  sgMail.setApiKey(key);

  await sgMail.send(
    createMsgContent({ html, subject: `New submission!`, to, ...getCustomArgs(sgArgs) })
  );
};

export const sendNewQuoteEmail = async (
  key: string,
  link: string,
  to: string | string[],
  addressLine1?: string,
  toName?: string,
  sgArgs?: ExtraSendGridArgs
) => {
  const html = newQuote({ link, toName, addressLine1 });
  sgMail.setApiKey(key);

  await sgMail.send(
    createMsgContent({ html, subject: `Here's your quote!`, to, ...getCustomArgs(sgArgs) })
  );
};

export const sendPolicyDocDelivery = async (
  sgKey: string,
  to: string | string[],
  attachments: AttachmentJSON[],
  toName?: string,
  addressName?: string,
  sgArgs?: ExtraSendGridArgs
) => {
  const html = policyDelivery({ toName, addressName });
  sgMail.setApiKey(sgKey);

  await sgMail.send(
    createMsgContent({
      html,
      subject: `Congrats! Here's your new policy`,
      to,
      attachments,
      ...getCustomArgs(sgArgs),
    })
  );
};

export const sendAdminPaidNotification = async (
  sgKey: string,
  to: string | string[],
  policyLink: string,
  policyId: string,
  transactionLink: string,
  transactionId: string,
  sgArgs?: ExtraSendGridArgs
) => {
  const html = adminPaymentReceived({ policyLink, policyId, transactionLink, transactionId });
  sgMail.setApiKey(sgKey);

  await sgMail.send(
    createMsgContent({
      html,
      subject: `Payment received (${transactionId})`,
      to,
      ...getCustomArgs(sgArgs),
    })
  );
};

export const sendAgencyAppApprovedNotification = async (
  key: string,
  tenantId: string,
  orgName: string,
  email: string,
  to: string | string[],
  firstName?: string | null,
  lastName?: string | null,
  message?: string | null,
  sgArgs?: ExtraSendGridArgs
) => {
  const link = `${process.env.HOSTING_BASE_URL}/auth/create-account/${encodeURIComponent(
    tenantId
  )}?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(
    firstName || ''
  )}&lastName=${encodeURIComponent(lastName || '')}`;

  const html = agencyAppApproved({ firstName, orgName, link, message });

  sgMail.setApiKey(key);

  await sgMail.send(
    createMsgContent({
      to,
      html,
      subject: 'Finish setting up your account',
      ...getCustomArgs(sgArgs),
    })
  );

  return { link };
};

export const sendAdminChangeRequestNotification = async (
  key: string,
  to: string | string[],
  link: string,
  requestType: string,
  entityId: string,
  changes: Record<string, any>,
  sgArgs?: ExtraSendGridArgs
) => {
  const html = adminChangeRequest({
    link,
    requestType,
    entityId,
    changes,
  });

  sgMail.setApiKey(key);
  await sgMail.send(
    createMsgContent({
      to,
      html,
      subject: 'Change request received',
      ...getCustomArgs(sgArgs),
    })
  );
};

export const sendAdminPolicyImportNotification = async (
  key: string,
  to: string | string[],
  successCount: number,
  errorCount: number,
  invalidDataCount: number,
  fileName: string,
  link?: string | null | undefined,
  toName?: string,
  sgArgs?: ExtraSendGridArgs
) => {
  const html = adminImportNotification({
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
      ...getCustomArgs(sgArgs),
    })
  );
};

export const sendQuoteExpiringSoonNotification = async (
  key: string,
  to: string | string[],
  link: string,
  addressLine1: string,
  toName?: string,
  sgArgs?: ExtraSendGridArgs
) => {
  const html = quoteExpiringSoon({
    link,
    addressLine1,
    toName,
  });

  sgMail.setApiKey(key);
  await sgMail.send(
    createMsgContent({
      to,
      html,
      subject: 'Quote expires tomorrow',
      ...getCustomArgs(sgArgs),
    })
  );
};

export const sendMessage = async (
  key: string,
  to: string | string[],
  msgBody: string,
  subject: string,
  toName?: string,
  sgArgs?: ExtraSendGridArgs
) => {
  const html = blankHTML({ toName, content: msgBody });
  sgMail.setApiKey(key);
  await sgMail.send(
    createMsgContent({
      to,
      html,
      subject,
      ...getCustomArgs(sgArgs),
    })
  );
};

export const moveTenantVerification = async (
  key: string,
  to: string | string[],
  link: string,
  toName?: string,
  toOrgName?: string,
  sgArgs?: ExtraSendGridArgs
) => {
  const html = moveToTenantConfirmation({
    toName,
    toOrgName,
    link,
  });

  sgMail.setApiKey(key);
  await sgMail.send(
    createMsgContent({
      to,
      html,
      subject: 'Confirm org migration',
      ...getCustomArgs(sgArgs),
    })
  );
};
