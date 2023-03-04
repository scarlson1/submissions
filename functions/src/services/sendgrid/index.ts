import sgMail from '@sendgrid/mail';

import {
  submissionReceived,
  adminNewSubmission,
  emailConfirmation,
  userInvite,
  adminNewAgencySubmission,
  newQuote,
} from './templates';

export interface CreateMsgContentProps {
  to: string | string[];
  subject: string;
  html: string;
}

const createMsgContent = ({ to, subject, html }: CreateMsgContentProps) => {
  // if (process.env.AUDIENCE === 'LOCAL HUMANS') {
  //   to = 'spencercarlson@mac.com';
  // }
  return {
    to,
    from: 'Hello@idemandinsurance.com',
    subject,
    html,
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
  email: string,
  toName: string | null | undefined = undefined,
  fromName: string | null | undefined = undefined
) => {
  const html = userInvite({ toName, fromName, link });
  sgMail.setApiKey(key);

  await sgMail
    // .sendMultiple(msg)
    .send(createMsgContent({ html, subject: 'Create an account', to: email }));
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
