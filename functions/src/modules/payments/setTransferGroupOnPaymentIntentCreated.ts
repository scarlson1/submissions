// CANNOT UPDATE PAYMENT INTENT TRANSFER GROUP CREATED FROM INVOICE
/*
  "message": "Some of the parameters you provided (transfer_group) cannot be used when modifying a PaymentIntent that was created by an invoice. You can try again without those parameters."
*/

// must specify source_transaction when making transfers b/c transfer_group cannot be set from invoice

/* 
  If the source charge has a transfer_group value, Stripe assigns the same value to the transfer’s transfer_group. If it doesn’t, then Stripe generates a string in the format group_ plus the associated PaymentIntent ID, for example: group_pi_2NHDDD589O8KAxCG0179Du2s. It assigns that string as the transfer_group for both the charge and the transfer.

  src: https://stripe.com/docs/connect/separate-charges-and-transfers#transfer-availability
*/

import { receivablesCollection } from '@idemand/common';
import { getFirestore } from 'firebase-admin/firestore';
import { info, warn } from 'firebase-functions/logger';
import Stripe from 'stripe';
import { getReportErrorFn } from '../../common/index.js';
import { createTransferGroupId } from '../db/utils.js';

const reportErr = getReportErrorFn('setTransferGroupOnPaymentIntentCreated');

// TODO: any point to specifying transfer group if it cannot be set on payment intent for invoice generated PI ??
// use source_transaction only ?? transfer group not currently being used anywhere (except for queries)
// could cause bugs if we specify transfer group in the future on non-invoice generated payment intents ??)

export const setTransferGroupOnPaymentIntentCreated = async (
  // stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent,
) => {
  try {
    // if (paymentIntent.invoice) {
    const db = getFirestore();
    const receivablesCol = receivablesCollection(db);
    let q;
    if (paymentIntent.invoice) {
      q = receivablesCol.where('invoiceId', '==', paymentIntent.invoice);
    } else {
      q = receivablesCol.where('paymentIntentId', '==', paymentIntent.id);
    }

    const querySnap = await q.get();

    if (!querySnap.empty) {
      const receivableSnap = querySnap.docs[0];

      // const transferGroup = receivableSnap.data().transferGroup;
      const transferGroup = createTransferGroupId(paymentIntent.id);

      await receivableSnap.ref.update({
        transferGroup,
      });

      // await stripe.paymentIntents.update(paymentIntent.id, {
      //   transfer_group: transferGroup || '',
      // });

      info(
        `Update receivable with transfer group ${transferGroup} from invoice-generated (${paymentIntent.invoice}) payment intent (${paymentIntent.id})`,
      );
    } else {
      warn(
        `No receivable found matching invoice (${paymentIntent.invoice}) from paymentIntent (${paymentIntent.id}) created event`,
      );
    }
    // } else {
    //   warn(`Payment intent not created by invoice`, { ...paymentIntent });
    // }
  } catch (err: any) {
    let msg = 'error setting transfer group on payment intent (invoice)';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...paymentIntent }, err);
  }
  return;
};
