import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import { floor } from 'lodash-es';
import Stripe from 'stripe';
import {
  getReportErrorFn,
  stripeSecretKey,
  transfersCollection,
} from '../../common/index.js';
import { getStripe } from '../../services/stripe.js';
import { verify } from '../../utils/validation.js';
import { extractPubSubPayload } from '../utils/extractPubSubPayload.js';

// TODO:
// create refunds collection
// on refund triggered --> create refund record in DB (aggregate transactions ??)
// create refund in stripe
// on refund.created --> get DB refund record --> create tax reversals & transfers

// docs: https://stripe.com/docs/connect/separate-charges-and-transfers#issuing-refunds
//  It is only possible to reverse a transfer if the connected account’s available balance is greater than the reversal amount or has connected reserves enabled.

const reportErr = getReportErrorFn('createTransfersOnChargeComplete');

export interface RefundCreatedPayload {
  refund: Stripe.Refund; // or use charge.refunded event ??
}

// TODO: finish calcing transfer refund amount (store percent in original transfer ??)

export default async (
  event: CloudEvent<MessagePublishedData<RefundCreatedPayload>>,
) => {
  info(
    'STRIPE CHARGE SUCCEEDED EVENT (create transfers listener) - MSG JSON: ',
    {
      ...(event.data?.message?.json || {}),
    },
  );

  const { refund } = extractPubSubPayload(event, ['refund']);

  try {
    verify(refund, 'missing refund data');
  } catch (err: any) {
    const errMsg = err?.message || 'validation failed';
    reportErr(errMsg, { ...event });
    return;
  }
  const sourceTransaction = refund.charge; // TODO: need to handle out of bank payments
  // refund.payment_intent

  // const base = refund.amount - nonRefundableTaxes - nonRefundableFees
  // const reverseTransferAmount = base * transferPct

  // base = 400 - 20 - 50 = 330
  // reversalAmount = 330 * 15%

  const stripe = getStripe(stripeSecretKey.value());
  const db = getFirestore();
  const transfersCol = transfersCollection(db);

  try {
    if (typeof sourceTransaction !== 'string')
      throw new Error('charge ID must be a string');
    const charge = await stripe.charges.retrieve(sourceTransaction);
    // subtract taxes and handle taxes separately ??
    // calc amount = charge total - refunded amount * percentage of transfer ??
    // TODO: need to subtract taxes / fees ??
    // after checking if taxes are refundable

    // transfer queries not supported in stripe --> need to duplicate in our DB
    const transferSnaps = await transfersCol
      .where('source_transaction', '==', sourceTransaction)
      .where('object', '==', 'transfer')
      .get();

    if (transferSnaps.empty)
      throw new Error('could not find transfers to reverse refund');

    const batch = db.batch();

    // TODO: idempotency -- make sure transfer not created more than once
    // check for reversal with refund ID and connect account ID ??
    // add totalRefunded to transfer object ?? make sure it doesn't except transfer amount ??
    for (const transferSnap of transferSnaps.docs) {
      // TODO: inspection fees and mga fees are earned (subtract)
      // flat cancel returns everything except inspection fee
      // TODO: need to subtract taxes
      const transferData = transferSnap.data();
      // TODO: need to calc net of taxes/fees ?? use/check values from receivable refundable ??
      // amount captured will include taxes and fees --> need to look up refundable value from receivable

      // const transferPct = charge.amount_captured / transferData.amount; // BUG: should be inverse ??
      const transferPct = transferData.amount / charge.amount_captured;
      const transferRefundAmt = floor(refund.amount * transferPct);
      console.log('transfer refund amount: ', transferRefundAmt);
      // TODO: use totalAmountPaid (claude suggestion) ?? seems wrong - won't work if invoice paid in multiple payments ??
      // 100 invoice with 3 payments of 25 -> $20 gets refunded -> locates 1 transfer - are charges & transfers mapped 1:1?
      // from charge -> transfer pct = $5 / $25 = 0.2 -> 0.2 * 20 => $4
      // const refundPct = refund.amount / receivable.totalAmountPaid;
      // const reversalAmount = Math.round(refundPct * receivable.totalTransferred);

      const transferReversal = await stripe.transfers.createReversal(
        transferSnap.id,
        {
          amount: transferRefundAmt,
        },
      );

      // redundant - setting from webhook event ['transfer.reversed'] - delete ?? Or transferReversal is different object ?? 'transfer.reversed' is still needed to update the original transfer ??
      const reversalRef = transfersCol.doc(transferReversal.id);
      batch.set(reversalRef, {
        ...transferReversal,
        metadata: {
          ...transferReversal.metadata,
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      });
    }

    await batch.commit();
    info('successfully created transfer reversals');
  } catch (err: any) {
    const msg = 'error creating transfers on charge.succeeded';

    reportErr(msg, {}, err);
  }

  return;
};
