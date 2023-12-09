import { info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import { getReportErrorFn } from '../../common/index.js';
import { extractPubSubPayload } from '../utils/extractPubSubPayload.js';
import { ChargeSucceededPayload } from './createTaxTransactionsOnChargeSucceeded.js';

const reportErr = getReportErrorFn('markPaidOnChargeComplete');

export default async (event: CloudEvent<MessagePublishedData<ChargeSucceededPayload>>) => {
  info('STRIPE CHARGE SUCCEEDED EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  const { charge } = extractPubSubPayload(event, ['charge']);
  console.log('charge: ', charge);
  // // get policy ID from charge (or are we saving separate collection in our DB ??)
  // const policyId = charge?.metadata?.policyId; // does invoice/payment intent forward metadata to charge object ??
  // const amount = charge?.amount;
  // const amountCaptured = charge?.amount_captured;
  // const captured = charge?.captured;
  // const paid = charge?.paid; // true if successful or successfully authorized for later capture
  // const invoice = charge?.invoice;
  // const paymentIntent = charge?.payment_intent;
  // const transferGroup = charge?.transfer_group; // transfer group set when payment intent / invoice is created

  // const db = getFirestore();
  // const policiesCol = policiesCollection(db);

  try {
    throw new Error('mark paid on succeeded handler not set up yet');
  } catch (err: any) {
    let msg = 'error updating policy on charge.succeeded';

    reportErr(msg, {}, err);
  }

  return;
};
