import { getFirestore } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { info } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { Policy, WithId } from '@idemand/common';
import {
  adminNotificationEmail,
  audience,
  getReportErrorFn,
  hostingBaseURL,
  policiesCollection,
  resendKey,
} from '../common/index.js';
import { sendMessage } from '../services/sendgrid/index.js';
import { verify } from '../utils/index.js';
import { extractPubSubPayload } from './utils/extractPubSubPayload.js';

const reportErr = getReportErrorFn('renewalLapsedListener');

export interface RenewalLapsedPayload {
  policyId: string;
}

/**
 * Listens for `policy.renewal.lapsed` PubSub messages.
 *
 * Notifies the named insured and agent that their policy has expired without
 * renewal. Logs the event for audit and compliance purposes.
 */
export default async (
  event: CloudEvent<MessagePublishedData<RenewalLapsedPayload>>,
) => {
  info('RENEWAL LAPSED EVENT', { ...(event.data?.message?.json || {}) });

  const { policyId } = extractPubSubPayload(event, ['policyId']);

  const db = getFirestore();
  const policiesCol = policiesCollection(db);

  let policy: WithId<Policy>;

  try {
    verify(
      policyId && typeof policyId === 'string',
      'invalid/missing policyId',
    );

    const snap = await policiesCol.doc(policyId).get();
    verify(snap.exists, `Policy not found (${policyId})`);
    policy = { ...snap.data()!, id: policyId };
  } catch (err: any) {
    reportErr(err?.message || 'Error fetching policy', { policyId }, err);
    return;
  }

  info(
    `RENEWAL LAPSED: Policy ${policyId} has lapsed. Notifying insured and agent.`,
    {
      policyId,
      namedInsuredEmail: policy.namedInsured?.email,
      agentEmail: policy.agent?.email,
    },
  );

  // ── Send lapse notifications ────────────────────────────────────────────────

  try {
    const to: string[] = [];
    if (policy.namedInsured?.email) to.push(policy.namedInsured.email);
    if (policy.agent?.email) to.push(policy.agent.email);

    const audienceVal = audience.value();
    if (audienceVal === 'DEV HUMANS' || audienceVal === 'LOCAL HUMANS') {
      to.push(adminNotificationEmail.value());
    }

    if (!to.length) {
      info(
        `RENEWAL LAPSED: No recipients found for policy ${policyId}. Skipping notification.`,
      );
      return;
    }

    const baseURL = hostingBaseURL.value();
    const primaryAddress =
      Object.values(policy.locations)[0]?.address?.s1 ?? '';
    const addressLabel = primaryAddress
      ? ` for <strong>${primaryAddress}</strong>`
      : '';
    const expirationDateStr = new Date(
      policy.expirationDate.toMillis(),
    ).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const msgBody = `
      <p>Your flood insurance policy${addressLabel} <strong>expired on ${expirationDateStr}</strong> and has lapsed. You currently have a gap in flood coverage.</p>
      <p>To obtain new coverage, please <a href="${baseURL}/submissions/new/flood">start a new submission</a> or contact your agent directly.</p>
      <p><strong>Note:</strong> A new policy issued after a lapse may be subject to re-underwriting, updated rates, and a new effective date.</p>
    `;

    await sendMessage(
      resendKey.value(),
      to,
      msgBody,
      'Your flood insurance policy has lapsed',
    );

    info(`RENEWAL LAPSED: Lapse notifications sent for policy ${policyId}`, {
      to,
    });
  } catch (err: any) {
    reportErr('Error sending lapse notifications', { policyId }, err);
  }
};
