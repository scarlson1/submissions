import { UpdateData, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import Stripe from 'stripe';
import { Payable, getReportErrorFn, payablesCollection } from '../../common/index.js';

const reportErr = getReportErrorFn('handleInvoiceFinalized');

export const handleInvoiceFinalized = async (invoice: Stripe.Invoice) => {
  try {
    const db = getFirestore();
    const q = payablesCollection(db).where('invoiceId', '==', invoice.id).limit(1);

    const snaps = await q.get();

    if (snaps.empty) {
      reportErr(`no payable found with invoice ID matching ${invoice.id}`);
      return;
    }

    const payableSnap = snaps.docs[0];
    // TODO: need to validate payable state (not already paid, etc.) ??

    const updates: UpdateData<Payable> = {};
    if (typeof invoice.payment_intent === 'string')
      updates['paymentIntentId'] = invoice.payment_intent;
    if (invoice.hosted_invoice_url) updates['hostedInvoiceUrl'] = invoice.hosted_invoice_url;
    // download invoice url
    if (invoice.invoice_pdf) updates['invoicePdfUrl'] = invoice.invoice_pdf;
    if (invoice.number) updates['invoiceNumber'] = invoice.number;

    info(
      `Updating payable ${payableSnap.id} with invoice url and payment intent from invoice finalized event data`,
      { ...updates }
    );
    await payableSnap.ref.update(updates);

    return updates;
  } catch (err: any) {
    let msg = `Error updating payable on invoice finalized`;
    if (err?.message) msg += err.message;
    reportErr(msg, { ...invoice }, err);
    return;
  }
};
