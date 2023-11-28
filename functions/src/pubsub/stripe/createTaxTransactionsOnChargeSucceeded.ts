import { taxTransactionsCollection } from '@idemand/common';
import { getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import Stripe from 'stripe';
import { getReportErrorFn } from '../../common/index.js';

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

  // get policy ID from charge (or are we saving separate collection in our DB ??)
  const policyId = charge?.metadata?.policyId; // does invoice/payment intent forward metadata to charge object ??
  const amount = charge?.amount;
  const amountCaptured = charge?.amount_captured;
  const captured = charge?.captured;
  const paid = charge?.paid; // true if successful or successfully authorized for later capture
  const invoice = charge?.invoice;
  const paymentIntent = charge?.payment_intent;
  const transferGroup = charge?.transfer_group; // transfer group set when payment intent / invoice is created

  // NEED TO GET payment

  // must create static "payables/orders" collection for each invoice / charge
  // cannot use policy b/c policy could change
  // how would it tie to transactions, if at all ??

  const db = getFirestore();
  // const policiesCol = policiesCollection(db);
  const taxTrxCol = taxTransactionsCollection(db);

  try {
    // get policy or payable/order
    // either use tax data from policy (or if moved to tax calc)
    const taxTrxObject = { status: 'TODO' };

    // TODO: construct doc ID to avoid duplication
    const taxTrxId = ''; // invoice/payment intent + taxId ?? (or stripe event ID ??)

    // @ts-ignore
    await taxTrxCol.doc(taxTrxId).set(taxTrxObject);
  } catch (err: any) {
    let msg = 'error creating transfers on charge.succeeded';

    reportErr(msg, {}, err);
  }

  return;
};
