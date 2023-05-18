import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import logger from 'firebase-functions/logger';
import { getFirestore, Timestamp, DocumentSnapshot } from 'firebase-admin/firestore';

import {
  PaymentMethod,
  paymentMethodsCollection,
  policiesCollection,
  Policy,
  POLICY_STATUS,
  round,
  finTrxCollection,
  TRANSACTION_STATUS,
} from '../common';
import { getEPayInstance } from '../services';
import { publishMessage } from '../services/pubsub/publishMessage.js';
import { ePayCreds as ePayCredsSecret } from '../common';

// const ePayCreds = defineSecret('ENCODED_EPAY_AUTH');
const CARD_FEE = 0.035;

export default async ({ data, auth }: CallableRequest) => {
  const { policyId, paymentMethodId } = data;
  const uid = auth?.uid;

  if (!uid) throw new HttpsError('unauthenticated', 'Must be signed in');

  if (!policyId) throw new HttpsError('failed-precondition', 'Missing policy ID');
  if (!paymentMethodId) throw new HttpsError('failed-precondition', 'Missing paymentMethodId');

  try {
    const db = getFirestore();
    const policiesCol = policiesCollection(db);

    const policySnap: DocumentSnapshot<Policy> = await policiesCol.doc(policyId).get();
    const policy = policySnap.data();
    console.log('POLICY: ', policy);
    if (!policySnap.exists || !policy)
      throw new HttpsError('not-found', `Could not find policy with ID: ${policyId}`);

    let { price, effectiveDate, status } = policy;
    if (!price || !effectiveDate)
      throw new HttpsError('failed-precondition', 'Quote is missing required fields');

    if (status !== POLICY_STATUS.AWAITING_PAYMENT)
      throw new HttpsError('failed-precondition', 'Policy status must be "awaiting payment"');

    const paymentMethodSnap: DocumentSnapshot<PaymentMethod> = await paymentMethodsCollection(
      db,
      uid
    )
      .doc(paymentMethodId)
      .get();

    let paymentMethodDetails = paymentMethodSnap.data();
    if (!paymentMethodSnap.exists || !paymentMethodDetails)
      throw new HttpsError('not-found', 'Payment method not found');

    const ePayCreds = ePayCredsSecret.value();
    if (!ePayCreds) throw new Error('Missing required env vars');

    const ePayInstance = getEPayInstance(ePayCreds);

    let ePayFees =
      paymentMethodDetails.transactionType === 'Ach'
        ? 0
        : policy.cardFee || round(price * CARD_FEE, 2);

    const total = price + ePayFees;
    console.log(`PRICE (${price}) + EPAY_FEES (${ePayFees}) = TOTAL (${total})`);

    if (total < 100) throw new Error('Total less than minimum premium');

    let {
      headers: { location },
    } = await ePayInstance.post('/api/v1/transactions', {
      payer: paymentMethodDetails.payer,
      amount: total,
      payerFee: ePayFees,
      attributeValues: {
        policyNumber: policyId,
        namedInsured: `${policy.namedInsured.firstName} ${policy.namedInsured.lastName}`,
        policyId,
        userId: uid,
        agentId: policy.agent.agentId || null,
        agencyId: policy.agency.orgId || null,
      },
      emailAddress: paymentMethodDetails.emailAddress,
      tokenId: paymentMethodId,
      sendReceipt: true,
      ipAddress: auth?.token.signInIpAddress, // ctx.rawRequest.ip,
    });

    let transactionId = location?.split('/')[2];
    console.log('transactionId: ', transactionId);

    if (!transactionId) throw new Error('Missing transactionId');

    // TODO: move handling status to payment:complete event listener
    // TODO: emit event "payment:complete" data: { policyId, transactionId }
    // trigger same event when ach payment is complete
    // handle policy status and transaction status updates

    await publishMessage('payment.complete', {
      policyId,
      transactionId,
    });

    await finTrxCollection(db)
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
        policyId,
        userId: uid,
        paymentMethodId,
        paymentMethodDetails,
        receiptEmail: paymentMethodDetails.emailAddress,
        receiptNumber: null,
        receiptUrl: null,
        refunded: false,
        publicDescriptor: `Flood insurance for ${policy.address.addressLine1}`,
        publicDescriptorTitle: 'Flood insurance',
        // status: newStatus === QUOTE_STATUS.PAID ? 'succeeded' : 'processing',
        status:
          paymentMethodDetails.transactionType === 'Ach'
            ? TRANSACTION_STATUS.PROCESSING
            : TRANSACTION_STATUS.SUCCEEDED,
        metadata: {
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      });

    // await publishMessage('sk-upload', {
    //   uploadId,
    //   uploadFileName,
    //   iDemandProcessId,
    //   iDemandFileId: fileId,
    //   iDemandBatchIds: fileIds,
    //   filesInBatchCount: batch,
    //   originalHeaders: headers,
    //   originalFilePath: filePath,
    //   totalRowCount: dataArray.length,
    // });

    return {
      transactionId,
      status: paymentMethodDetails.transactionType === 'Ach' ? 'processing' : 'succeeded',
    };
  } catch (err: any) {
    // TODO: save failed transaction in db so it matches ePay ??
    console.log('ERROR: ', err);
    // TODO: extract error message from ePay error if code is 400: https://docs.epaypolicy.com/knowledgebase/faqs/
    let msg = err?.response?.data?.message || 'Payment could not be processed.';
    logger.error(msg, {
      data,
      userId: uid,
      stack: err?.stack || null,
      message: err?.response?.data?.message ?? (err?.message || null),
    });

    throw new HttpsError('internal', msg);
  }
};

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

// import * as functions from 'firebase-functions';
// import { getFirestore, DocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
// import { defineSecret } from 'firebase-functions/params';

// import {
//   PaymentMethod,
//   paymentMethodsCollection,
//   QUOTE_STATUS,
//   round,
//   submissionsQuotesCollection,
//   transactionsCollection,
//   TRANSACTION_STATUS,
// } from '../common';
// import { getEPayInstance } from '../services';

// const ePayCreds = defineSecret('ENCODED_EPAY_AUTH');
// const CARD_FEE = 0.035;

// export const executePayment = functions
//   .runWith({
//     secrets: [ePayCreds],
//   })
//   .https.onCall(async (data, ctx) => {
//     const { quoteId, paymentMethodId } = data;
//     const uid: string | undefined = ctx.auth?.uid;

//     if (!uid) throw new .HttpsError('unauthenticated', 'Must be signed in');

//     if (!quoteId) throw new .HttpsError('failed-precondition', 'Missing quote ID');
//     if (!paymentMethodId)
//       throw new .HttpsError('failed-precondition', 'Missing paymentMethodId');

//     try {
//       const db = getFirestore();
//       const quotesCollection = submissionsQuotesCollection(db);

//       const quoteSnap = await quotesCollection.doc(quoteId).get();
//       const quote = quoteSnap.data();
//       console.log('QUOTE: ', quote);
//       if (!quoteSnap.exists || !quote)
//         throw new .HttpsError(
//           'not-found',
//           `Could not find quote with ID: ${quoteId}`
//         );

//       let { quoteTotal, quoteExpiration, status } = quote;
//       if (!quoteTotal || !quoteExpiration)
//         throw new .HttpsError(
//           'failed-precondition',
//           'Quote is missing required fields'
//         );

//       if (status !== QUOTE_STATUS.AWAITING_USER)
//         throw new .HttpsError('failed-precondition', 'Blocked by quote status');

//       const paymentMethodSnap: DocumentSnapshot<PaymentMethod> = await paymentMethodsCollection(
//         db,
//         uid
//       )
//         .doc(paymentMethodId)
//         .get();

//       let paymentMethodDetails = paymentMethodSnap.data();
//       if (!paymentMethodSnap.exists || !paymentMethodDetails)
//         throw new .HttpsError('not-found', 'Payment method not found');

//       const ePayCreds = process.env.ENCODED_EPAY_AUTH;
//       if (!ePayCreds) throw new Error('Missing required env vars');

//       const ePayInstance = getEPayInstance(ePayCreds);
//       // TODO: use ePay fees calculated when quote was created ??
//       let ePayFees =
//         paymentMethodDetails.transactionType === 'Ach'
//           ? 0
//           : quote.cardFee || round(quoteTotal * CARD_FEE, 2);

//       const total = quoteTotal + ePayFees;
//       console.log('EPAY FEES: ', ePayFees);
//       console.log('TOTAL: ', total);

//       if (total < 100) throw new Error('Total less than minimum premium');

//       let {
//         headers: { location },
//       } = await ePayInstance.post('/api/v1/transactions', {
//         payer: paymentMethodDetails.payer,
//         amount: total,
//         payerFee: ePayFees,
//         attributeValues: {
//           quoteId,
//           userId: uid,
//         },
//         comments: `Quote ID: ${quoteId}`,
//         emailAddress: paymentMethodDetails.emailAddress,
//         tokenId: paymentMethodId,
//         sendReceipt: true,
//         ipAddress: ctx.rawRequest.ip,
//       });

//       let transactionId = location?.split('/')[2];
//       console.log('transactionId: ', transactionId);

//       if (!transactionId) throw new Error('Missing transactionId');

//       // const newStatus =
//       //   paymentMethodDetails.transactionType === 'Ach'
//       //     ? QUOTE_STATUS.PAYMENT_PROCESSING
//       //     : QUOTE_STATUS.PAID;
//       const newStatus = 'TODO';

//       // TODO: emit event "payment:complete" data: { quoteId, transactionId }
//       // trigger same event when ach payment is complete
//       // handle quote status updates there and update transaction document (ach change to paid)
//       await quoteSnap.ref.update({ status: newStatus });

//       await transactionsCollection(db)
//         .doc(transactionId)
//         .set({
//           transactionId,
//           amount: total,
//           amountCaptured: 0,
//           amountRefunded: 0,
//           processingFees: ePayFees,
//           billingDetails: {
//             address: null,
//             email: paymentMethodDetails.emailAddress,
//             name: paymentMethodDetails.payer,
//             phone: null,
//           },
//           invoiceId: null,
//           quoteId,
//           userId: uid,
//           paymentMethodId,
//           paymentMethodDetails,
//           receiptEmail: paymentMethodDetails.emailAddress,
//           receiptNumber: null,
//           receiptUrl: null,
//           refunded: false,
//           publicDescriptor: `Flood insurance for ${quote?.insuredAddress?.addressLine1}`,
//           publicDescriptorTitle: 'Flood insurance',
//           // status: newStatus === QUOTE_STATUS.PAID ? 'succeeded' : 'processing',
//           status:
//             paymentMethodDetails.transactionType === 'Ach'
//               ? TRANSACTION_STATUS.PROCESSING
//               : TRANSACTION_STATUS.SUCCEEDED,
//           metadata: {
//             created: Timestamp.now(),
//             updated: Timestamp.now(),
//           },
//         });

//       return {
//         transactionId,
//         status: paymentMethodDetails.transactionType === 'Ach' ? 'processing' : 'succeeded',
//       };
//     } catch (err: any) {
//       // TODO: save failed transaction in db so it matches ePay ??
//       console.log('ERROR: ', err);
//       // TODO: extract error message from ePay error if code is 400: https://docs.epaypolicy.com/knowledgebase/faqs/
//       let msg = err?.response?.data?.message || 'Payment could not be processed.';

//       throw new .HttpsError('internal', msg);
//     }
//   });

// // validate
// // calc expiration date

// // execute payment ?? or emit event ?? events:
// //  - notify idemand admins
// //  - send charge payment method
// //  downside:
// //  - cannot show user payment errors at checkout
// // split into multiple processes
// //  - payment: explicitly called at checkout
// //  - then emit event to do everything else
