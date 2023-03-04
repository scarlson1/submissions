import * as functions from 'firebase-functions';
import { getFirestore, DocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

import {
  PaymentMethod,
  paymentMethodsCollection,
  QUOTE_STATUS,
  round,
  submissionsQuotesCollection,
  transactionsCollection,
} from '../common';
import { getEPayInstance } from '../services';

const ePayCreds = defineSecret('ENCODED_EPAY_AUTH');
const CARD_FEE = 0.035;

export const executePayment = functions
  .runWith({
    secrets: [ePayCreds],
  })
  .https.onCall(async (data, ctx) => {
    const { quoteId, paymentMethodId } = data;
    const uid: string | undefined = ctx.auth?.uid;

    if (!uid) throw new functions.https.HttpsError('unauthenticated', 'Must be signed in');

    if (!quoteId) throw new functions.https.HttpsError('failed-precondition', 'Missing quote ID');
    if (!paymentMethodId)
      throw new functions.https.HttpsError('failed-precondition', 'Missing paymentMethodId');

    try {
      const db = getFirestore();
      const quotesCollection = submissionsQuotesCollection(db);

      const quoteSnap = await quotesCollection.doc(quoteId).get();
      const quote = quoteSnap.data();
      console.log('QUOTE: ', quote);
      if (!quoteSnap.exists || !quote)
        throw new functions.https.HttpsError(
          'not-found',
          `Could not find quote with ID: ${quoteId}`
        );

      let { quoteTotal, quoteExpiration, status } = quote;
      if (!quoteTotal || !quoteExpiration)
        throw new functions.https.HttpsError(
          'failed-precondition',
          'Quote is missing required fields'
        );

      if (status !== QUOTE_STATUS.AWAITING_USER)
        throw new functions.https.HttpsError('failed-precondition', 'Blocked by quote status');

      const paymentMethodSnap: DocumentSnapshot<PaymentMethod> = await paymentMethodsCollection(
        db,
        uid
      )
        .doc(paymentMethodId)
        .get();
      let paymentMethodDetails = paymentMethodSnap.data();
      if (!paymentMethodSnap.exists || !paymentMethodDetails)
        throw new functions.https.HttpsError('not-found', 'Payment method not found');

      const ePayCreds = process.env.ENCODED_EPAY_AUTH;
      if (!ePayCreds) throw new Error('Missing required env vars');

      const ePayInstance = getEPayInstance(ePayCreds);
      // TODO: use ePay fees calculated when quote was created ??
      let ePayFees =
        paymentMethodDetails.transactionType === 'Ach'
          ? 0
          : quote.ePayCardFee || round(quoteTotal * CARD_FEE, 2);

      const total = quoteTotal + ePayFees;
      console.log('EPAY FEES: ', ePayFees);
      console.log('TOTAL: ', total);

      if (total < 100) throw new Error('Total less than minimum premium');

      let {
        headers: { location },
      } = await ePayInstance.post('/api/v1/transactions', {
        payer: paymentMethodDetails.payer,
        amount: total,
        payerFee: ePayFees,
        attributeValues: {
          quoteId,
          userId: uid,
        },
        comments: `Quote ID: ${quoteId}`,
        emailAddress: paymentMethodDetails.emailAddress,
        tokenId: paymentMethodId,
        sendReceipt: true,
        ipAddress: ctx.rawRequest.ip,
      });

      let transactionId = location?.split('/')[2];
      console.log('transactionId: ', transactionId);

      if (!transactionId) throw new Error('Missing transactionId');

      const newStatus =
        paymentMethodDetails.transactionType === 'Ach'
          ? QUOTE_STATUS.PAYMENT_PROCESSING
          : QUOTE_STATUS.PAID;

      // TODO: emit event "payment:complete" data: { quoteId, transactionId }
      // trigger same event when ach payment is complete
      // handle quote status updates there and update transaction document (ach change to paid)
      await quoteSnap.ref.update({ status: newStatus });

      await transactionsCollection(db)
        .doc(transactionId)
        .set({
          transactionId,
          amount: total,
          amountCaptured: 0,
          amountRefunded: 0,
          processingFees: ePayFees,
          billingDetails: {
            address: null,
            email: paymentMethodDetails.emailAddress,
            name: paymentMethodDetails.payer,
            phone: null,
          },
          invoiceId: null,
          userId: uid,
          paymentMethodId,
          paymentMethodDetails,
          receiptEmail: paymentMethodDetails.emailAddress,
          receiptNumber: null,
          receiptUrl: null,
          refunded: false,
          publicDescriptor: `Flood insurance for ${quote?.insuredAddress?.addressLine1}`,
          publicDescriptorTitle: 'Flood insurance',
          status: newStatus === QUOTE_STATUS.PAID ? 'succeeded' : 'processing',
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });

      return {
        transactionId,
        status: newStatus === QUOTE_STATUS.PAID ? 'succeeded' : 'processing',
      };
    } catch (err: any) {
      console.log('ERROR: ', err);
      let msg = err?.response?.data?.message || 'Payment could not be processed.';

      throw new functions.https.HttpsError('internal', msg);
    }
  });

// validate
// calc expiration date

// execute payment ?? or emit event ?? events:
//  - notify idemand admins
//  - send charge payment method
//  downside:
//  - cannot show user payment errors at checkout
// split into multiple processes
//  - payment: explicitly called at checkout
//  - then emit event to do everything else
