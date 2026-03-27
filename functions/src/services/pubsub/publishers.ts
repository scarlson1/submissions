import { MISC_PUB_SUB_TOPICS, PUB_SUB_TOPICS } from '../../common/index.js';
import { GetStaticMapImagesPayload } from '../../pubsub/getStaticMapImages.js';
import { GetStaticPolicyMapImagesPayload } from '../../pubsub/getStaticPolicyMapImages.js';
import { PaymentCompletePayload } from '../../pubsub/markPaidOnPaymentComplete.js';
import { publishMessage } from './publishMessage.js';

export function publishGetLocationImages(payload: GetStaticMapImagesPayload) {
  return publishMessage(MISC_PUB_SUB_TOPICS.LOCATION_IMG, payload);
}

export function publishGetPolicyImages(payload: GetStaticPolicyMapImagesPayload) {
  return publishMessage(MISC_PUB_SUB_TOPICS.POLICY_IMG, payload);
}

// TODO: rename to payment executed/initiated (payment complete once payment has processed)
export function publishPaymentComplete(payload: PaymentCompletePayload) {
  return publishMessage(PUB_SUB_TOPICS.PAYMENT_COMPLETE, payload);
}
