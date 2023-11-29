import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import { floor } from 'lodash-es';
import Stripe from 'stripe';
import { getReportErrorFn, stripeSecretKey, transfersCollection } from '../../common/index.js';
import { getStripe } from '../../services/stripe.js';
import { verify } from '../../utils/validation.js';

// docs: https://stripe.com/docs/connect/separate-charges-and-transfers#issuing-refunds
//  It is only possible to reverse a transfer if the connected account’s available balance is greater than the reversal amount or has connected reserves enabled.

const reportErr = getReportErrorFn('createTransfersOnChargeComplete');

interface ReverseTransfersOnRefundPayload {
  refund: Stripe.Refund; // or use charge.refunded event ??
}

// TODO: finish calcing transfer refund amount (store percent in original transfer ??)

export default async (event: CloudEvent<MessagePublishedData<ReverseTransfersOnRefundPayload>>) => {
  info('STRIPE CHARGE SUCCEEDED EVENT (create transfers listener) - MSG JSON: ', {
    ...(event.data?.message?.json || {}),
  });

  let refund = null;

  try {
    refund = event.data?.message?.json?.refund;
  } catch (e) {
    reportErr('PubSub message was not JSON', {}, e);
  }

  try {
    verify(refund, 'missing refund data');
  } catch (err: any) {
    let errMsg = 'validation failed';
    if (err?.message) errMsg = err.message;
    reportErr(errMsg, { ...event });
    return;
  }

  const amount = refund.amount;
  const sourceTransaction = refund.charge;

  const stripe = getStripe(stripeSecretKey.value());
  const db = getFirestore();
  const transfersCol = transfersCollection(db);

  try {
    if (typeof sourceTransaction !== 'string') throw new Error('charge ID must be a string');
    const charge = await stripe.charges.retrieve(sourceTransaction);
    // subtract taxes and handle taxes separately ??
    // calc amount = charge total - refunded amount * percentage of transfer ??
    // after checking if taxes are refundable

    // need to mirror transfers in stripe in our db ?? cannot query transfers by charge ID
    // if using refund.created event:
    const transferSnaps = await transfersCol
      .where('source_transaction', '==', sourceTransaction)
      .where('object', '==', 'transfer')
      .get();

    if (transferSnaps.empty) throw new Error('could not find transfers to reverse refund');

    const batch = db.batch();

    for (let transferSnap of transferSnaps.docs) {
      // TODO: calc transfer refund amount
      // TODO: inspection fees and mga fees are earned (subtract)
      // flat cancel returns everything except inspection fee
      const transferData = transferSnap.data();
      const transferPct = charge.amount_captured / transferData.amount;
      const transferRefundAmt = floor(amount * transferPct);
      console.log('transfer refund amount: ', transferRefundAmt);

      const transferReversal = await stripe.transfers.createReversal(transferSnap.id, {
        amount: transferRefundAmt,
      });

      let reversalRef = transfersCol.doc(transferReversal.id);
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
    info(`successfully created transfer reversals`);
  } catch (err: any) {
    let msg = 'error creating transfers on charge.succeeded';

    reportErr(msg, {}, err);
  }

  return;
};
