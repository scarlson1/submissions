import { getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import Stripe from 'stripe';
import {
  getReportErrorFn,
  payablesCollection,
  stripeSecretKey,
  transfersCollection,
} from '../../common/index.js';
import { getStripe } from '../../services/stripe.js';
import { verify } from '../../utils/validation.js';

const reportErr = getReportErrorFn('createTransfersOnChargeComplete');

interface CreateTransfersOnChargeSucceededPayload {
  charge: Stripe.Charge;
  // TODO: include other stripe event data ??
}

export default async (
  event: CloudEvent<MessagePublishedData<CreateTransfersOnChargeSucceededPayload>>
) => {
  info('STRIPE CHARGE SUCCEEDED EVENT (create transfers listener) - MSG JSON: ', {
    ...(event.data?.message?.json || {}),
  });

  // const eventId = event.id;
  let charge = null;

  try {
    charge = event.data?.message?.json?.charge;
  } catch (e) {
    reportErr('PubSub message was not JSON', {}, e);
  }

  try {
    verify(charge, 'pub sub event missing charge data');
  } catch (err: any) {
    reportErr(err?.message || '', { ...event }, err);
    return;
  }

  // get policy ID from charge (or are we saving separate collection in our DB ??)
  const policyId = charge?.metadata?.policyId; // does invoice/payment intent forward metadata to charge object ??
  const amount = charge?.amount;
  const amountCaptured = charge?.amount_captured;
  const captured = charge?.captured;
  const paid = charge?.paid; // true if successful or successfully authorized for later capture
  const invoice = charge?.invoice;
  const paymentIntent = charge?.payment_intent;
  const transferGroup = charge?.transfer_group; // transfer group set when payment intent / invoice is created

  const stripe = getStripe(stripeSecretKey.value());
  const db = getFirestore();
  // const policiesCol = policiesCollection(db);
  const payablesCol = payablesCollection(db);
  const transfersCol = transfersCollection(db);

  try {
    // TODO: determine best query to get correct payable (billing group, invoice id,  etc.)
    // get payable - transferGroup not available from invoice charge ??
    // could use webhook to set the transfer group when invoice creates payment intent ??
    const payableQuery = payablesCol;
    if (transferGroup) {
      payableQuery.where('transferGroup', '==', transferGroup);
    } else if (invoice) {
      payableQuery.where('invoiceId', '==', invoice);
    } else if (paymentIntent) {
      payableQuery.where('paymentIntentId', '==', paymentIntent);
    } else {
      throw new Error('unable to query payable with information in charge object');
    }

    const payableSnap = await payableQuery.orderBy('metadata.created', 'desc').limit(1).get();
    if (payableSnap.empty)
      throw new Error(`could not find payable to create transfers for charge ${charge?.id}`);

    const transfers = payableSnap.docs[0].data()?.transfers;
    // TODO: zod validation ??
    if (!Array.isArray(transfers) || !transfers.length) {
      info(`No transfers found on payable ${payableSnap.docs[0].id}. returning early.`);
      return;
    }

    // loop through payable.transfers
    // add to batch
    // commit batch

    const batch = db.batch();

    for (let t of transfers) {
      const transfer = await stripe.transfers.create({
        amount: t.amount,
        currency: 'usd',
        source_transaction: charge.id,
        destination: t.destination, // '{{CONNECTED_ACCOUNT_ID}}'
      });
      const transferRef = transfersCol.doc(transfer.id);
      batch.set(transferRef, transfer);
    }

    await batch.commit();
  } catch (err: any) {
    let msg = 'error creating transfers on charge.succeeded';

    reportErr(msg, {}, err);
  }

  return;
};
