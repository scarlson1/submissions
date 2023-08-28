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

export const getstaticmapimages = onMessagePublished(
  { topic: PUB_SUB_TOPICS.LOCATION_IMG },
  async (event) => {
    await (await import('./getStaticMapImages.js')).default(event);
  }
);

export const policyrenewallistener = onMessagePublished(
  { topic: PUB_SUB_TOPICS.POLICY_RENEWAL },
  async (event) => {
    await (await import('./policyRenewalListener.js')).default(event);
  }
);

export const endorsementlistener = onMessagePublished(
  { topic: PUB_SUB_TOPICS.ENDORSEMENT },
  async (event) => {
    await (await import('./endorsementListener.js')).default(event);
  }
);

export const amendmentlistener = onMessagePublished(
  { topic: PUB_SUB_TOPICS.AMENDMENT },
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

export type { AmendmentPayload } from './amendmentListener';
export type { EndorsementPayload } from './endorsementListener';
export type { LocationCancelPayload } from './locationCancelListener';
export { PolicyCreatedPayload } from './policyCreatedListener';
export { PolicyRenewalPayload } from './policyRenewalListener';
export { ReinstatementPayload } from './reinstatementListener';
