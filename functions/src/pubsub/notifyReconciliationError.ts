import type { CloudEvent } from 'firebase-functions/core';
import { error, info } from 'firebase-functions/logger';
import type { MessagePublishedData } from 'firebase-functions/pubsub';
import { Resend } from 'resend';
import {
  adminNotificationEmail,
  resendKey,
} from '../common/environmentVars.js';
import { EmailType } from '../services/sendgrid/index.js';
import { extractPubSubPayload } from './utils';

export interface ReconciliationErrorPayload {
  reportId: string;
}

export default async (
  event: CloudEvent<MessagePublishedData<ReconciliationErrorPayload>>,
) => {
  const { reportId } = extractPubSubPayload(event, ['reportId']);

  const resend = new Resend(resendKey.value());

  const { data, error: err } = await resend.emails.send({
    from: 'iDemand Insurance <noreply@s-carlson.com>',
    to: adminNotificationEmail.value(),
    subject: 'Reconciliation Error',
    html: `<div><p>Hello,</p><br/> <br/><p>Tax reconciliation errors (report ID: ${reportId})</p><br/> <br/><p>iDemand Team</p></div>`,
    // html,
    tags: [{ name: 'emailType', value: EmailType.enum.general }],
  });

  info(`reconciliation report error notification sent`, data);

  if (err) {
    error(`Error sending tax reconciliation error notification`, err);
  }
};
