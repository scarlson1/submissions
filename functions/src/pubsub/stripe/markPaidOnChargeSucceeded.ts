import { getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import Stripe from 'stripe';
import { getReportErrorFn, policiesCollection } from '../../common/index.js';

const reportErr = getReportErrorFn('markPaidOnChargeComplete');

interface MarkPaidOnChargeSucceededPayload {
  charge: Stripe.Charge;
  // TODO: include other stripe event data ??
}

export default async (
  event: CloudEvent<MessagePublishedData<MarkPaidOnChargeSucceededPayload>>
) => {
  info('STRIPE CHARGE SUCCEEDED EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  // const eventId = event.id;
  let charge = null;

  try {
    charge = event.data?.message?.json?.charge;
  } catch (e) {
    reportErr('PubSub message was not JSON', {}, e);
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

  const db = getFirestore();
  const policiesCol = policiesCollection(db);

  try {
  } catch (err: any) {
    let msg = 'error updating policy on charge.succeeded';

    reportErr(msg, {}, err);
  }

  return;
};
