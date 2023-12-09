import { getFirestore } from 'firebase-admin/firestore';
import { info, warn } from 'firebase-functions/logger';
import Stripe from 'stripe';
import { getReportErrorFn, payablesCollection } from '../../common/index.js';

const reportErr = getReportErrorFn('setTransferGroupOnPaymentIntentCreated');

export const setTransferGroupOnPaymentIntentCreated = async (
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent
) => {
  try {
    if (paymentIntent.invoice) {
      const db = getFirestore();
      const payablesCol = payablesCollection(db);
      const querySnap = await payablesCol.where('invoiceId', '==', paymentIntent.invoice).get();
      if (!querySnap.empty) {
        const payableSnap = querySnap.docs[0];
        // set payment intent in payable ?? or set from invoice.finalized ??
        const transferGroup = payableSnap.data().transferGroup;
        await stripe.paymentIntents.update(paymentIntent.id, {
          transfer_group: transferGroup || '',
        });
        info(
          `Update invoice-generated (${paymentIntent.invoice}) payment intent (${paymentIntent.id}) with transfer group ${transferGroup} from payable doc`
        );
      } else {
        warn(
          `No payable found matching invoice (${paymentIntent.invoice}) from paymentIntent (${paymentIntent.id}) created event`
        );
      }
    } else {
      warn(`Payment intent not created by invoice`, { ...paymentIntent });
    }
  } catch (err: any) {
    let msg = 'error setting transfer group on payment intent (invoice)';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...paymentIntent }, err);
  }
  return;
};
