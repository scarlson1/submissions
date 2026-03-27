import { PAYMENT_PUB_SUB_TOPICS } from '../../common/index.js';
import { ChargeSucceededPayload, RefundCreatedPayload } from '../../pubsub/stripe/index.js';
import { publishMessage } from './publishMessage.js';

export function publishChargeSucceeded(payload: ChargeSucceededPayload) {
  return publishMessage(PAYMENT_PUB_SUB_TOPICS.CHARGE_SUCCEEDED, payload);
}

export function publishRefundCreated(payload: RefundCreatedPayload) {
  return publishMessage(PAYMENT_PUB_SUB_TOPICS.REFUND_CREATED, payload);
}
