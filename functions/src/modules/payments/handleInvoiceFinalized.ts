import { getFirestore, UpdateData } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import Stripe from 'stripe';
import {
  getReportErrorFn,
  Receivable,
  receivablesCollection,
} from '../../common/index.js';

const reportErr = getReportErrorFn('handleInvoiceFinalized');

export const handleInvoiceFinalized = async (
  invoice: Stripe.Invoice,
): Promise<UpdateData<Receivable> | void> => {
  try {
    const db = getFirestore();
    const q = receivablesCollection(db)
      .where('invoiceId', '==', invoice.id)
      .limit(1);

    const snaps = await q.get();

    if (snaps.empty) {
      reportErr(`no receivable found with invoice ID matching ${invoice.id}`);
      return;
    }

    const receivableSnap = snaps.docs[0];
    const receivable = receivableSnap.data();
    // TODO: need to validate receivable state (not already paid, etc.) ??

    const updates: UpdateData<Receivable> = {};
    if (typeof invoice.payment_intent === 'string')
      updates['paymentIntentId'] = invoice.payment_intent;
    if (invoice.hosted_invoice_url)
      updates['hostedInvoiceUrl'] = invoice.hosted_invoice_url;
    // download invoice url
    if (invoice.invoice_pdf) updates['invoicePdfUrl'] = invoice.invoice_pdf;
    if (invoice.number) updates['invoiceNumber'] = invoice.number;

    // This is more reliable than trusting the webhook event alone, since invoice.paid can fire before all charge.succeeded events have been processed. (TODO: remove status updates in other invoice.paid handlers)
    if (receivable.totalAmountPaid >= receivable.totalAmount) {
      updates['status'] = 'paid';
      updates['paid'] = true;
    }

    info(
      `Updating receivable ${receivableSnap.id} with invoice url and payment intent from invoice finalized event data`,
      { ...updates },
    );
    await receivableSnap.ref.update(updates);

    return updates;
  } catch (err: any) {
    let msg = 'Error updating receivable on invoice finalized';
    if (err?.message) msg += err.message;
    reportErr(msg, { ...invoice }, err);
    return;
  }
};
