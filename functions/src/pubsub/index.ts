import { onMessagePublished } from 'firebase-functions/v2/pubsub';

import { PUB_SUB_TOPICS, sendgridApiKey } from '../common';

// TODO: failureRetry policy

export const markpaidonpaymentcomplete = onMessagePublished(
  { topic: PUB_SUB_TOPICS.PAYMENT_COMPLETE, secrets: [sendgridApiKey] },
  async (event) => {
    await (await import('./markPaidOnPaymentComplete.js')).default(event);
  }
);

export const policycreatedlistener = onMessagePublished(
  { topic: PUB_SUB_TOPICS.POLICY_CREATED },
  async (event) => {
    await (await import('./policyCreatedListener.js')).default(event);
  }
);

export const policyrenewallistener = onMessagePublished(
  { topic: PUB_SUB_TOPICS.POLICY_RENEWAL },
  async (event) => {
    await (await import('./policyRenewalListener.js')).default(event);
  }
);

export const endorsementlistener = onMessagePublished(
  { topic: PUB_SUB_TOPICS.LOCATION_ENDORSEMENT },
  async (event) => {
    await (await import('./endorsementListener.js')).default(event);
  }
);

export const amendmentlistener = onMessagePublished(
  { topic: PUB_SUB_TOPICS.POLICY_AMENDMENT },
  async (event) => {
    await (await import('./amendmentListener.js')).default(event);
  }
);

export const locationcancellistener = onMessagePublished(
  { topic: PUB_SUB_TOPICS.LOCATION_CANCELLATION },
  async (event) => {
    await (await import('./locationCancelListener.js')).default(event);
  }
);
