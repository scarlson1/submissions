import { onMessagePublished } from 'firebase-functions/v2/pubsub';

import {
  MiscPubSubTopics,
  PUB_SUB_TOPICS,
  PmtPubSubTopics,
  TrxPubSubTopics,
  sendgridApiKey,
} from '../common/index.js';

// TODO: failureRetry policy

// PUB_SUB_TOPICS.PAYMENT_COMPLETE
export const markpaidonpaymentcomplete = onMessagePublished(
  { topic: PmtPubSubTopics.enum.PAYMENT_COMPLETE, secrets: [sendgridApiKey] },
  async (event) => {
    await (await import('./markPaidOnPaymentComplete.js')).default(event);
  }
);

export const policycreatedlistener = onMessagePublished(
  { topic: TrxPubSubTopics.enum.POLICY_CREATED }, // PUB_SUB_TOPICS.POLICY_CREATED
  async (event) => {
    await (await import('./policyCreatedListener.js')).default(event);
  }
);

// blurhash takes ~20s / image to hash
export const getstaticmapimages = onMessagePublished(
  {
    topic: MiscPubSubTopics.enum.LOCATION_IMG,
    concurrency: 10,
    timeoutSeconds: 300,
    memory: '1GiB',
  }, // PUB_SUB_TOPICS.LOCATION_IMG
  async (event) => {
    await (await import('./getStaticMapImages.js')).default(event);
  }
);

export const getstaticpolicymapimages = onMessagePublished(
  {
    topic: MiscPubSubTopics.enum.POLICY_IMG,
    concurrency: 10,
    timeoutSeconds: 300,
    memory: '1GiB',
  }, // PUB_SUB_TOPICS.LOCATION_IMG
  async (event) => {
    await (await import('./getStaticPolicyMapImages.js')).default(event);
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

export type { AmendmentPayload } from './amendmentListener.js';
export type { EndorsementPayload } from './endorsementListener.js';
export type { LocationCancelPayload } from './locationCancelListener.js';
export { PolicyCreatedPayload } from './policyCreatedListener.js';
export { PolicyRenewalPayload } from './policyRenewalListener.js';
export { ReinstatementPayload } from './reinstatementListener.js';
