import { getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import {
  getReportErrorFn,
  policiesCollection,
  receivablesCollection,
} from '../../common/index.js';
import { extractPubSubPayload } from '../utils/extractPubSubPayload.js';
import {
  ChargeSucceededPayload,
  getReceivablesQueryFromCharge,
} from './createTaxTransactionsOnChargeSucceeded.js';

// TODO: handle verifying full policy amount paid, etc.

const reportErr = getReportErrorFn('markPaidOnChargeComplete');

export default async (
  event: CloudEvent<MessagePublishedData<ChargeSucceededPayload>>,
) => {
  info('STRIPE CHARGE SUCCEEDED EVENT - MSG JSON: ', {
    ...(event.data?.message?.json || {}),
  });

  const { charge, paidOutOfBand } = extractPubSubPayload(event, [
    'charge',
    'paidOutOfBand',
  ]);
  console.log('charge: ', charge);

  // // get policy ID from charge (or are we saving separate collection in our DB ??)
  // const policyId = charge?.metadata?.policyId; // does invoice/payment intent forward metadata to charge object ??
  // const amount = charge?.amount;
  // const amountCaptured = charge?.amount_captured;
  // const captured = charge?.captured;
  // const paid = charge?.paid; // true if successful or successfully authorized for later capture
  // const receiptUrl = charge.receipt_url
  // const paymentIntent = charge?.payment_intent;
  // const transferGroup = charge?.transfer_group; // transfer group set when payment intent / invoice is created

  // const db = getFirestore();
  // const policiesCol = policiesCollection(db);

  // update receivable with receipt number ??
  // if (invoice.receipt_number)

  try {
    // const policyId = charge?.metadata?.policyId; // missing ?? why ??
    // if (!policyId) throw new Error('policyId not available in charge metadata'); // TODO: fallback on invoice ID receivables query ?
    const invoice = charge?.invoice;
    const paid = charge?.paid; // true if successful or successfully authorized for later capture
    if (!paid) throw new Error('`charge.paid` is not true');

    const db = getFirestore();

    const receivablesCol = receivablesCollection(db);
    const q = getReceivablesQueryFromCharge(receivablesCol, charge);
    const receivableSnap = (await q.get()).docs[0];
    // const receivablesQuery = await receivablesCol
    //   .where('invoiceId', '==', invoice)
    //   .limit(1)
    //   .get();

    // const receivableSnap = receivablesQuery.docs[0];
    const receivable = receivableSnap.data();

    const policyRef = policiesCollection(db).doc(receivable.policyId);

    // TODO: payment status should be by billing entity, not entire policy ??
    await policyRef.update({
      paymentStatus: 'paid',
    });
    info(`Policy marked as paid [${receivable.policyId}]`, charge);

    if (!receivableSnap) {
      error(`receivable not found for invoice ${invoice}`);
      return;
    }

    await receivableSnap.ref.update({
      status: 'paid',
      paid: charge.paid,
      receiptNumber: charge.receipt_number || null,
      hostedReceiptUrl: charge.receipt_url || null,
      paidOutOfBand: paidOutOfBand ?? false,
    });

    info(`Updated receivable to paid [${receivableSnap.id}]`);

    // TODO: which other docs need to be updated ?? receivable ??

    // throw new Error('mark paid on succeeded handler not set up yet');
  } catch (err: unknown) {
    const msg = 'error updating policy on charge.succeeded';

    reportErr(msg, {}, err);
  }

  return;
};
