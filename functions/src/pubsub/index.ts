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
