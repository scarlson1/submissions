import { onMessagePublished } from 'firebase-functions/v2/pubsub';

import { sendgridApiKey } from '../common';

// TODO: failureRetry policy

export const markpaidonpaymentcomplete = onMessagePublished(
  { topic: 'payment.complete', secrets: [sendgridApiKey] },
  async (event) => {
    await (await import('./markPaidOnPaymentComplete.js')).default(event);
  }
);
