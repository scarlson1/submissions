import { EmailData } from '@sendgrid/helpers/classes/email-address';
import { MailData } from '@sendgrid/helpers/classes/mail';
// import { MailDataRequired } from '@sendgrid/mail';
import { projectID } from 'firebase-functions/params';
import { Resend, type Tag } from 'resend';

// TODO: switch to dynamic templates ??
// dynamic templates ref: https://docs.sendgrid.com/for-developers/sending-email/using-handlebars#password-reset
// categorize (action: password reset, confirm email, etc.; receipt: new policy, policy renewal, etc.; )
// use React Email (associated with Resend) - use build output to generate templates instead of adding dependencies and rendering within serverless

// dynamic templates nodejs lib implementation: https://stackoverflow.com/a/68423849

import z from 'zod';
import { env, hostingBaseURL } from '../../common/index.js';
import { uniqueStrings } from '../../utils/arrays.js';
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

const EmailType = z.enum([
  'submission_received',
  'submission_received_admin',
  'email_confirmation',
  'user_invite',
  'agency_submission',
  'quote_delivery',
  'policy_delivery',
  'payment_complete_policy_delivery',
  'agency_setup',
  'admin_change_request',
  'policy_import_staged',
  'quote_expiring',
  'custom',
  'move_tenant_verification',
]);

// function uniqueEmails(to: EmailData | EmailData[]) {
//   let uniqueTo = to;
//   if (Array.isArray(to)) {
//     const objs: EmailJSON[] = [];

//     for (const e of to) {
//       if (typeof e === 'string') {
//         objs.push({ email: e });
//       } else {
//         objs.push(e as EmailJSON);
//       }
//     }

//     uniqueTo = objs.filter(onlyUniqueObj<EmailJSON>('email'));
//   }
//   return uniqueTo;
// }

// const createMsgContent = ({
//   to,
//   from = { name: 'iDemand Insurance', email: 'Hello@idemandinsurance.com' },
//   subject,
//   html,
//   // attachments,
//   ...rest
// }: CreateMsgContentProps): MailDataRequired => {
//   const uniqueTo = uniqueEmails(to);

//   return {
//     to: uniqueTo,
//     from,
//     subject,
//     html,
//     // attachments,
//     ...rest,
//   };
// };

// type CustomArgs = { emailType: EmailTemplate } & Record<string, any>;
export type ExtraSendGridArgs = Omit<
  CreateMsgContentProps,
  'to' | 'from' | 'subject' | 'html' | 'attachments'
>;

function getCustomArgs(args?: Record<string, any> | undefined) {
  return {
    projectId: projectID.value(),
    environment: env.value(),
    ...(args || {}),
  };
}

function customArgsToResendTags(args: Record<string, unknown>): Tag[] {
  return Object.entries(args).map(([k, v]) => ({
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: "We've received your submission!",
    html,
    tags: customArgsToResendTags(
      getCustomArgs({
        emailType: EmailType.enum.submission_received,
        ...sgArgs,
      }),
    ),
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const tags = customArgsToResendTags(
    getCustomArgs({
      emailType: EmailType.enum.submission_received_admin,
      ...(sgArgs || {}),
    }),
  );

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: 'New submission!',
    html,
    tags,
  });

  if (error) throw new Error(error.message);

  return data;
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: 'Please confirm your email',
    html,
    tags: customArgsToResendTags(
      getCustomArgs({
        emailType: EmailType.enum.email_confirmation,
        ...(sgArgs || {}),
      }),
    ),
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: 'Create an account',
    html,
    tags: customArgsToResendTags(
      getCustomArgs({
        emailType: EmailType.enum.user_invite,
        ...(sgArgs || {}),
      }),
    ),
  });

  if (error) throw new Error(error.message);

  return data;
};

export const sendNewAgencySubmissionAdminNotification = async (
  key: string,
  link: string,
  orgName: string,
  to: string | string[],
  sgArgs?: ExtraSendGridArgs,
) => {
  const html = adminNewAgencySubmission({ link, orgName });
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: 'New submission!',
    html,
    tags: customArgsToResendTags(
      getCustomArgs({
        emailType: EmailType.enum.agency_submission,
        ...(sgArgs || {}),
      }),
    ),
  });

  if (error) throw new Error(error.message);

  return data;
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const tags = customArgsToResendTags(
    getCustomArgs({
      emailType: EmailType.enum.submission_received_admin,
      ...(sgArgs || {}),
    }),
  );

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: "Here's your quote!",
    html,
    tags,
  });

  if (error) throw new Error(error.message);

  return data;
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: "Congrats! Here's your new policy",
    html,
    attachments,
    tags: customArgsToResendTags(
      getCustomArgs({
        emailType: EmailType.enum.policy_delivery,
        ...(sgArgs || {}),
      }),
    ),
  });

  if (error) throw new Error(error.message);

  return data;
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: "Congrats! Here's your new policy",
    html,
    tags: customArgsToResendTags(
      getCustomArgs({
        emailType: EmailType.enum.payment_complete_policy_delivery,
        ...(sgArgs || {}),
      }),
    ),
  });

  if (error) throw new Error(error.message);

  return data;
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const { error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: 'Finish setting up your account',
    html,
    tags: customArgsToResendTags(
      getCustomArgs({
        emailType: EmailType.enum.agency_setup,
        ...(sgArgs || {}),
      }),
    ),
  });

  if (error) throw new Error(error.message);

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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: 'Change request received',
    html,
    tags: customArgsToResendTags(
      getCustomArgs({
        emailType: EmailType.enum.admin_change_request,
        ...(sgArgs || {}),
      }),
    ),
  });

  if (error) throw new Error(error.message);

  return data;
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: 'Policy import staged',
    html,
    tags: customArgsToResendTags(
      getCustomArgs({
        emailType: EmailType.enum.policy_import_staged,
        ...(sgArgs || {}),
      }),
    ),
  });

  if (error) throw new Error(error.message);

  return data;
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: 'Quote expires tomorrow',
    html,
    tags: customArgsToResendTags(
      getCustomArgs({
        emailType: EmailType.enum.quote_expiring,
        ...(sgArgs || {}),
      }),
    ),
  });

  if (error) throw new Error(error.message);

  return data;
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject,
    html,
    tags: customArgsToResendTags(
      getCustomArgs({ emailType: EmailType.enum.custom, ...(sgArgs || {}) }),
    ),
  });

  if (error) throw new Error(error.message);

  return data;
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
  const uniqueTo = Array.isArray(to) ? uniqueStrings(to) : to;

  const resend = new Resend(key);

  const { data, error } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: uniqueTo,
    subject: 'Confirm org migration',
    html,
    tags: customArgsToResendTags(
      getCustomArgs({
        emailType: EmailType.enum.move_tenant_verification,
        ...(sgArgs || {}),
      }),
    ),
  });

  if (error) throw new Error(error.message);

  return data;
};
