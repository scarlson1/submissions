import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import { PaymentPubSubTopics, stripeSecretKey } from '../../common/index.js';
import type { ChargeSucceededPayload } from './createTaxTransactionsOnChargeSucceeded.js';
import type { RefundCreatedPayload } from './reverseTransfersOnRefund.js';

export const createtaxtransactions = onMessagePublished<ChargeSucceededPayload>(
  { topic: PaymentPubSubTopics.enum.CHARGE_SUCCEEDED },
  async (event) => {
    await (
      await import('./createTaxTransactionsOnChargeSucceeded.js')
    ).default(event);
  },
);

export const createtransfers = onMessagePublished<ChargeSucceededPayload>(
  {
    topic: PaymentPubSubTopics.enum.CHARGE_SUCCEEDED,
    secrets: [stripeSecretKey],
  },
  async (event) => {
    await (
      await import('./createTransfersOnChargeSucceeded.js')
    ).default(event);
  },
);

export const markpolicypaid = onMessagePublished<ChargeSucceededPayload>(
  { topic: PaymentPubSubTopics.enum.CHARGE_SUCCEEDED },
  async (event) => {
    await (await import('./markPaidOnChargeSucceeded.js')).default(event);
  },
);

export const reversetaxtransactions = onMessagePublished<RefundCreatedPayload>(
  { topic: PaymentPubSubTopics.enum.REFUND_CREATED },
  async (event) => {
    await (await import('./reverseTaxTransactionsOnRefund.js')).default(event);
  },
);

export const reversetransfers = onMessagePublished<RefundCreatedPayload>(
  { topic: PaymentPubSubTopics.enum.REFUND_CREATED },
  async (event) => {
    await (await import('./reverseTransfersOnRefund.js')).default(event);
  },
);

// export type { ChargeSucceededPayload } from './createTaxTransactionsOnChargeSucceeded.js';
// export type { RefundCreatedPayload } from './reverseTransfersOnRefund.js';
export type { ChargeSucceededPayload, RefundCreatedPayload };
