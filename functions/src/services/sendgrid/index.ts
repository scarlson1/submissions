import { EmailData } from '@sendgrid/helpers/classes/email-address';
import { MailData } from '@sendgrid/helpers/classes/mail';
import { MailDataRequired } from '@sendgrid/mail';
import { projectID } from 'firebase-functions/params';
import { Resend, type Tag } from 'resend';

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

import { EmailTemplates, env, hostingBaseURL } from '../../common/index.js';
import { onlyUniqueObj } from '../../utils/arrays.js';
import {
  adminChangeRequest,
  adminImportNotification,
  adminNewAgencySubmission,
  adminNewSubmission,
  adminPaymentReceived,
  agencyAppApproved,
  blankHTML,
  emailConfirmation,
  moveToTenantConfirmation,
  newQuote,
  policyDelivery,
  quoteExpiringSoon,
  submissionReceived,
  userInvite,
} from './templates/index.js';

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

// TODO: move to ./utils ??
function uniqueEmails(to: EmailData | EmailData[]) {
  let uniqueTo = to;
  if (Array.isArray(to)) {
    const objs: EmailJSON[] = [];

    for (const e of to) {
      if (typeof e === 'string') {
        objs.push({ email: e });
      } else {
        objs.push(e as EmailJSON);
      }
    }

    uniqueTo = objs.filter(onlyUniqueObj<EmailJSON>('email'));
  }
  return uniqueTo;
}

const createMsgContent = ({
  to,
  from = { name: 'iDemand Insurance', email: 'Hello@idemandinsurance.com' },
  subject,
  html,
  // attachments,
  ...rest
}: CreateMsgContentProps): MailDataRequired => {
  const uniqueTo = uniqueEmails(to);

  return {
    to: uniqueTo,
    from,
    subject,
    html,
    // attachments,
    ...rest,
  };
};

type CustomArgs = { emailType: EmailTemplates } & Record<string, any>;
export interface ExtraSendGridArgs extends Omit<
  CreateMsgContentProps,
  'to' | 'from' | 'subject' | 'html' | 'attachments'
> {
  customArgs: CustomArgs;
}

function getCustomArgs(args?: Record<string, any> | undefined) {
  return {
    projectId: projectID.value(),
    environment: env.value(),
    ...(args || {}),
  };
}

function customArgsToResendTags(args: Record<string, unknown>): Tag[] {
  return Object.entries(args).map((k, v) => ({
    name: String(k),
    value: typeof v === 'string' ? v : String(v),
  }));
}

export const sendSubmissionReceivedConfirmation = async (
  key: string,
  createAccountLink: string,
  to: string | string[],
  toName: string | undefined | null,
  addressLine1: string,
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = submissionReceived({
    toName: toName,
    addressLine1,
    createAccountLink,
  });
  // sgMail.setApiKey(key);
  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: "We've received your submission!",
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;

  // await sgMail.send(
  //   createMsgContent({
  //     html,
  //     subject: "We've received your submission!",
  //     to,
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );
};

export const sendNewSubmissionAdminNotification = async (
  key: string,
  link: string,
  addressLine1: string,
  city: string,
  state: string,
  to: string | string[],
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = adminNewSubmission({ link, addressLine1, city, state });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: 'New submission!',
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;
  // sgMail.setApiKey(key);

  // await sgMail.send(
  //   createMsgContent({
  //     html,
  //     subject: 'New submission!',
  //     to,
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );
};

export const sendEmailConfirmation = async (
  key: string,
  link: string,
  to: string | string[],
  toName?: string,
  sgArgs?: ExtraSendGridArgs,
) => {
  const resend = new Resend(key);
  const html = emailConfirmation({ toName, link });

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: 'Please confirm your email',
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  // TODO: use templates:
  // await resend.emails.send({
  //   from: 'Acme <onboarding@resend.dev>',
  //   to: 'delivered@resend.dev',
  //   template: {
  //     id: 'order-confirmation',
  //     variables: {
  //       PRODUCT: 'Vintage Macintosh',
  //       PRICE: 499,
  //     },
  //   },
  // });

  if (error) throw new Error(error.message);

  return data;
  // sgMail.setApiKey(key);

  // await sgMail.send(
  //   createMsgContent({ html, subject: 'Please confirm your email', to, ...getCustomArgs(sgArgs) })
  // );
};

export const sendUserInvite = async (
  key: string,
  link: string,
  to: string | string[],
  toName: string | null | undefined = undefined,
  fromName: string | null | undefined = undefined,
  config?: Partial<CreateMsgContentProps>, // TODO: replace with sgArgs ??
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = userInvite({ toName, fromName, link });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: 'Create an account',
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;
  // sgMail.setApiKey(key);

  // await sgMail
  //   // .sendMultiple(msg)
  //   .send(
  //     createMsgContent({
  //       ...config,
  //       html,
  //       subject: 'Create an account',
  //       to,
  //       ...getCustomArgs(sgArgs),
  //     }),
  //   );
};

export const sendNewAgencySubmissionAdminNotification = async (
  key: string,
  link: string,
  orgName: string,
  to: string | string[],
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = adminNewAgencySubmission({ link, orgName });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: 'New submission!',
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;
  // sgMail.setApiKey(key);

  // await sgMail.send(
  //   createMsgContent({
  //     html,
  //     subject: 'New submission!',
  //     to,
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );
};

export const sendNewQuoteEmail = async (
  key: string,
  link: string,
  to: string | string[],
  addressLine1?: string,
  toName?: string,
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = newQuote({ link, toName, addressLine1 });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: "Here's your quote!",
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;
  // sgMail.setApiKey(key);

  // await sgMail.send(
  //   createMsgContent({
  //     html,
  //     subject: "Here's your quote!",
  //     to,
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );
};

export const sendPolicyDocDelivery = async (
  key: string,
  to: string | string[],
  attachments: AttachmentJSON[],
  toName?: string,
  addressName?: string,
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = policyDelivery({ toName, addressName });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: "Congrats! Here's your new policy",
    html,
    attachments,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;
  // sgMail.setApiKey(sgKey);

  // await sgMail.send(
  //   createMsgContent({
  //     html,
  //     subject: "Congrats! Here's your new policy",
  //     to,
  //     attachments,
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );
};

export const sendAdminPaidNotification = async (
  key: string,
  to: string | string[],
  policyLink: string,
  policyId: string,
  transactionLink: string,
  transactionId: string,
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = adminPaymentReceived({
    policyLink,
    policyId,
    transactionLink,
    transactionId,
  });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: "Congrats! Here's your new policy",
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;
  // sgMail.setApiKey(sgKey);

  // await sgMail.send(
  //   createMsgContent({
  //     html,
  //     subject: `Payment received (${transactionId})`,
  //     to,
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );
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
  sgArgs?: ExtraSendGridArgs,
) => {
  const link = `${hostingBaseURL.value()}/auth/create-account/${encodeURIComponent(
    tenantId,
  )}?email=${encodeURIComponent(email)}&firstName=${encodeURIComponent(
    firstName || '',
  )}&lastName=${encodeURIComponent(lastName || '')}`;

  const html = agencyAppApproved({ firstName, orgName, link, message });

  const resend = new Resend(key);

  const { error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: 'Finish setting up your account',
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  // sgMail.setApiKey(key);

  // await sgMail.send(
  //   createMsgContent({
  //     to,
  //     html,
  //     subject: 'Finish setting up your account',
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );

  return { link };
};

export const sendAdminChangeRequestNotification = async (
  key: string,
  to: string | string[],
  link: string,
  requestType: string,
  entityId: string,
  changes: Record<string, any>,
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = adminChangeRequest({
    link,
    requestType,
    entityId,
    changes,
  });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: 'Change request received',
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;

  // sgMail.setApiKey(key);
  // await sgMail.send(
  //   createMsgContent({
  //     to,
  //     html,
  //     subject: 'Change request received',
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );
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
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = adminImportNotification({
    successCount,
    errorCount,
    invalidDataCount,
    fileName,
    link,
    toName,
  });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: 'Policy import staged',
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;

  // sgMail.setApiKey(key);
  // await sgMail.send(
  //   createMsgContent({
  //     to,
  //     html,
  //     subject: 'Policy import staged',
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );
};

export const sendQuoteExpiringSoonNotification = async (
  key: string,
  to: string | string[],
  link: string,
  addressLine1: string,
  toName?: string,
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = quoteExpiringSoon({
    link,
    addressLine1,
    toName,
  });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: 'Quote expires tomorrow',
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;

  // sgMail.setApiKey(key);
  // await sgMail.send(
  //   createMsgContent({
  //     to,
  //     html,
  //     subject: 'Quote expires tomorrow',
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );
};

export const sendMessage = async (
  key: string,
  to: string | string[],
  msgBody: string,
  subject: string,
  toName?: string,
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = blankHTML({ toName, content: msgBody });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject,
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;
  // sgMail.setApiKey(key);

  // await sgMail.send(
  //   createMsgContent({
  //     to,
  //     html,
  //     subject,
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );
};

export const moveTenantVerification = async (
  key: string,
  to: string | string[],
  link: string,
  toName?: string,
  toOrgName?: string,
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = moveToTenantConfirmation({
    toName,
    toOrgName,
    link,
  });

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to,
    subject: 'Confirm org migration',
    html,
    tags: customArgsToResendTags(getCustomArgs(sgArgs)),
  });

  if (error) throw new Error(error.message);

  return data;

  // sgMail.setApiKey(key);
  // await sgMail.send(
  //   createMsgContent({
  //     to,
  //     html,
  //     subject: 'Confirm org migration',
  //     ...getCustomArgs(sgArgs),
  //   }),
  // );
};
