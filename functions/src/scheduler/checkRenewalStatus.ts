import { addDays, startOfDay, subDays } from 'date-fns';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { ScheduledEvent } from 'firebase-functions/v2/scheduler';

import { Policy, RenewalStatus, WithId } from '@idemand/common';
import {
  audience,
  hostingBaseURL,
  policiesCollection,
  resendKey,
} from '../common/index.js';
import { sendMessage } from '../services/sendgrid/index.js';
import {
  publishRenewalLapsed,
  publishRenewalRequested,
} from '../services/pubsub/trxPublishers.js';

/**
 * Scheduled daily at 6:00 AM UTC.
 *
 * Manages the full renewal lifecycle for expiring policies:
 *  - Triggers draft renewal quote generation (60 days out, first pass)
 *  - Sends reminder emails at 30-day and 7-day milestones
 *  - Marks policies as lapsed when they expire without being renewed
 */
export default async (_event: ScheduledEvent) => {
  info('RENEWAL STATUS CHECK - START');

  const db = getFirestore();
  const now = new Date();
  const policiesCol = policiesCollection(db);

  // ── 1. Upcoming policies (expiring within 60 days) ──────────────────────────

  const windowEnd = addDays(now, 60);
  let upcomingPolicies: WithId<Policy>[] = [];

  try {
    const snap = await policiesCol
      .where('expirationDate', '>=', Timestamp.fromDate(now))
      .where('expirationDate', '<=', Timestamp.fromDate(windowEnd))
      .get();

    upcomingPolicies = snap.docs
      .map((d) => ({ ...d.data(), id: d.id }))
      .filter((p) => !p.cancelEffDate);
  } catch (err: any) {
    error('RENEWAL CHECK: Error querying upcoming policies', { err });
    return;
  }

  info(`RENEWAL CHECK: ${upcomingPolicies.length} active policies expiring within 60 days`);

  const baseURL = hostingBaseURL.value();
  const audienceVal = audience.value();
  const emailKey = resendKey.value();

  for (const policy of upcomingPolicies) {
    try {
      const { renewalStatus } = policy;

      // Already handled — nothing to do
      if (renewalStatus === 'bound' || renewalStatus === 'non_renewed') continue;

      const expiresInDays = Math.floor(
        (policy.expirationDate.toMillis() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      // First pass: trigger quote generation and stamp 60-day notification
      if (!renewalStatus || renewalStatus === 'pending') {
        info(`RENEWAL CHECK: Requesting renewal quote for policy ${policy.id} (expires in ${expiresInDays} days)`);

        await publishRenewalRequested({ policyId: policy.id });
        await policiesCol.doc(policy.id).update({
          renewalStatus: 'pending' as RenewalStatus,
          'renewalNotifications.sent60': Timestamp.now(),
          'metadata.updated': Timestamp.now(),
        });
        continue;
      }

      if (renewalStatus !== 'quoted') continue;

      // 30-day reminder
      if (expiresInDays <= 30 && !policy.renewalNotifications?.sent30) {
        info(`RENEWAL CHECK: Sending 30-day reminder for policy ${policy.id}`);
        await sendRenewalReminder(policy, 30, emailKey, baseURL, audienceVal);
        await policiesCol.doc(policy.id).update({
          'renewalNotifications.sent30': Timestamp.now(),
          'metadata.updated': Timestamp.now(),
        });
      }

      // 7-day reminder
      if (expiresInDays <= 7 && !policy.renewalNotifications?.sent7) {
        info(`RENEWAL CHECK: Sending 7-day reminder for policy ${policy.id}`);
        await sendRenewalReminder(policy, 7, emailKey, baseURL, audienceVal);
        await policiesCol.doc(policy.id).update({
          'renewalNotifications.sent7': Timestamp.now(),
          'metadata.updated': Timestamp.now(),
        });
      }
    } catch (err: any) {
      error(`RENEWAL CHECK: Error processing policy ${policy.id}`, { policyId: policy.id, err });
    }
  }

  // ── 2. Lapsed policies (expired yesterday without renewal) ──────────────────

  const yesterday = startOfDay(subDays(now, 1));
  const todayStart = startOfDay(now);
  let lapsedCandidates: WithId<Policy>[] = [];

  try {
    const snap = await policiesCol
      .where('expirationDate', '>=', Timestamp.fromDate(yesterday))
      .where('expirationDate', '<', Timestamp.fromDate(todayStart))
      .get();

    lapsedCandidates = snap.docs
      .map((d) => ({ ...d.data(), id: d.id }))
      .filter((p) => {
        if (p.cancelEffDate) return false;
        const { renewalStatus } = p;
        return renewalStatus !== 'bound' && renewalStatus !== 'non_renewed' && renewalStatus !== 'lapsed';
      });
  } catch (err: any) {
    error('RENEWAL CHECK: Error querying lapsed policy candidates', { err });
  }

  info(`RENEWAL CHECK: ${lapsedCandidates.length} policies to mark as lapsed`);

  for (const policy of lapsedCandidates) {
    try {
      await policiesCol.doc(policy.id).update({
        renewalStatus: 'lapsed' as RenewalStatus,
        'metadata.updated': Timestamp.now(),
      });
      await publishRenewalLapsed({ policyId: policy.id });
      info(`RENEWAL CHECK: Marked policy ${policy.id} as lapsed`);
    } catch (err: any) {
      error(`RENEWAL CHECK: Error marking policy ${policy.id} as lapsed`, { policyId: policy.id, err });
    }
  }

  info('RENEWAL STATUS CHECK - COMPLETE');
};

async function sendRenewalReminder(
  policy: WithId<Policy>,
  daysRemaining: number,
  key: string,
  baseURL: string,
  audienceVal: string,
) {
  const to: string[] = [];
  if (policy.namedInsured?.email) to.push(policy.namedInsured.email);
  if (policy.agent?.email) to.push(policy.agent.email);
  if (audienceVal === 'DEV HUMANS' || audienceVal === 'LOCAL HUMANS') {
    to.push('spencer@s-carlson.com');
  }
  if (!to.length) return;

  const link = policy.renewalQuoteId
    ? `${baseURL}/quotes/${policy.renewalQuoteId}`
    : `${baseURL}/policies/${policy.id}`;

  const isUrgent = daysRemaining <= 7;
  const subject = isUrgent
    ? `URGENT: Your flood policy expires in ${daysRemaining} days`
    : `Action required: Your flood policy renews in ${daysRemaining} days`;

  const primaryAddress = Object.values(policy.locations)[0]?.address?.s1 ?? '';
  const addressLabel = primaryAddress ? ` for <strong>${primaryAddress}</strong>` : '';

  const msgBody = `
    <p>Your flood insurance policy${addressLabel} expires in <strong>${daysRemaining} day${daysRemaining === 1 ? '' : 's'}</strong>.</p>
    <p>Your renewal quote is ready. Please review and complete payment to maintain continuous coverage.</p>
    <p><a href="${link}">Review Renewal Quote →</a></p>
    <p>If you have questions, please contact your agent.</p>
  `;

  await sendMessage(key, to, msgBody, subject);
}
