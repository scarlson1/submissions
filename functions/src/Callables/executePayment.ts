import { PaymentStatus } from '@idemand/common';
import { DocumentSnapshot, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { round } from 'lodash-es';
import {
  FIN_TRANSACTION_STATUS,
  PUB_SUB_TOPICS,
  PaymentMethod,
  cardFeePct,
  ePayCreds as ePayCredsSecret,
  finTrxCollection,
  getReportErrorFn,
  paymentMethodsCollection,
  policiesCollection,
} from '../common/index.js';
import { getEPayInstance } from '../services/index.js';
import { publishPaymentComplete } from '../services/pubsub/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireAuth, validate } from './utils/index.js';

// const CARD_FEE = 0.035; // TODO: use env var

// TODO: generalize into "charge" object/record instead of only storing in policy ??
// study payment intent / invoice / charge flows in stripe & mirror flow/data structure
// create when policy created - sync "charge" with epay transaction ??

// TODO: refactor so payment method isn't fetched from user's collection
// need additional security checks so a payment method ID can't be passed from another user's account ??
// secure if user was able to add payment method to quote ??

// TODO: refactor to support multiple billing entities
// loop through totalsByBillingEntity --> look up payment method by billing entity --> execute payment
// TODO: support non-charge pmt methods (create invoice, etc.)

const reportErr = getReportErrorFn('executePayment');

interface ExecutePaymentProps {
  policyId: string;
  paymentMethodId: string;
}

const executePayment = async ({ data, auth }: CallableRequest<ExecutePaymentProps>) => {
  const { policyId, paymentMethodId } = data;

  requireAuth(auth);
  validate(policyId, 'failed-precondition', 'missing policy ID');
  validate(paymentMethodId, 'failed-precondition', 'missing payment method ID');

  const { uid } = auth;
  const feePct = Number.parseFloat(cardFeePct.value()) || 0.035;

  const db = getFirestore();
  const policiesCol = policiesCollection(db);

  const policySnap = await policiesCol.doc(policyId).get();
  const policy = policySnap.data();
  info('POLICY: ', { policy });

  validate(policySnap.exists && policy, 'not-found', `Could not find policy with ID: ${policyId}`);

  let { price, effectiveDate, paymentStatus, namedInsured, agent, agency } = policy;
  validate(price && effectiveDate, 'failed-precondition', 'Quote is missing required fields');
  validate(
    paymentStatus === PaymentStatus.enum.awaiting_payment,
    'failed-precondition',
    `Policy status must be "${PaymentStatus.enum.awaiting_payment}"`
  );

  // TODO: execute payment from payment method ID instead of fetching from db ??
  // switching away from storing under user ??
  // need payment method details in order to know transaction type
  // need to re-fetch details from epay ??
  const paymentMethodSnap: DocumentSnapshot<PaymentMethod> = await paymentMethodsCollection(db, uid)
    .doc(paymentMethodId)
    .get();

  let paymentMethodDetails = paymentMethodSnap.data();
  validate(
    paymentMethodSnap.exists && paymentMethodDetails,
    'not-found',
    'Payment method not found'
  );

  // const ePayCreds = ePayCredsSecret.value();
  // validate(ePayCreds, 'internal', 'missing required env vars');

  try {
    const ePayInstance = getEPayInstance(ePayCredsSecret.value());

    let ePayFees = paymentMethodDetails.transactionType === 'Ach' ? 0 : round(price * feePct, 2);

    const total = price + ePayFees;
    info(`PRICE (${price}) + EPAY_FEES (${ePayFees}) = TOTAL (${total})`);

    // delete validation ?? could be less that 100 if shorter term
    // validate(total >= 100, 'failed-precondition', 'total less than minimum premium');

    let {
      headers: { location },
    } = await ePayInstance.post('/api/v1/transactions', {
      payer: paymentMethodDetails.payer,
      amount: total,
      payerFee: ePayFees,
      attributeValues: {
        policyNumber: policyId,
        namedInsured: `${policy.namedInsured?.displayName}`,
        contact:
          `${policy.namedInsured?.firstName || ''} ${policy.namedInsured?.lastName || ''}`.trim() ||
          null,
        namedInsuredEmail: policy.namedInsured?.email || null,
        policyId,
        userId: uid,
        agent: policy.agent?.name || null,
        agentId: policy.agent?.userId || null,
        agency: policy.agency?.name || null,
        agencyId: policy.agency?.orgId || null,
      },
      emailAddress: paymentMethodDetails.emailAddress,
      tokenId: paymentMethodId,
      sendReceipt: true,
      ipAddress: auth?.token?.signInIpAddress || null, // ctx.rawRequest.ip,
    });

    let transactionId = location?.split('/')[2];
    info(`EPay transactionId: ${transactionId}`, { transactionId, policyId });

    validate(transactionId, 'internal', 'payment request failed - missing transactionId');

    // TODO: move handling status to payment:complete event listener
    // trigger same event when ach payment is complete
    const status =
      paymentMethodDetails.transactionType === 'Ach'
        ? FIN_TRANSACTION_STATUS.PROCESSING
        : FIN_TRANSACTION_STATUS.SUCCEEDED;

    try {
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
          publicDescriptor: `Flood insurance for policy ${policySnap.id}`,
          publicDescriptorTitle: 'iDemand Flood Insurance',
          status,
          namedInsured,
          agent,
          agency,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });
    } catch (err: any) {
      reportErr(
        `Error create financial transaction doc for ePay transaction ${transactionId}`,
        { transactionId, policyId },
        err
      );
    }

    if (status === FIN_TRANSACTION_STATUS.SUCCEEDED) {
      try {
        await publishPaymentComplete({
          policyId,
          transactionId,
        });
      } catch (err: any) {
        reportErr(
          `Failed to publish ${PUB_SUB_TOPICS.PAYMENT_COMPLETE} event`,
          { policyId, transactionId },
          err
        );
      }
    } else {
      try {
        await policySnap.ref.update({
          paymentStatus: PaymentStatus.enum.processing,
          'metadata.updated': Timestamp.now(),
        });
      } catch (err: any) {
        reportErr(
          'Error updating policy payment status to "pending"',
          { policyId, transactionId },
          err
        );
      }
    }

    return {
      transactionId,
      status,
    };
  } catch (err: any) {
    // TODO: save failed transaction in db so it matches ePay ??
    // TODO: extract error message from ePay error if code is 400: https://docs.epaypolicy.com/knowledgebase/faqs/
    let msg = err?.response?.data?.message || 'Payment could not be processed.';
    error(msg, {
      data,
      userId: uid,
      stack: err?.stack || null,
      message: err?.response?.data?.message ?? (err?.message || null),
    });

    throw new HttpsError('internal', msg);
  }
};

export default onCallWrapper<ExecutePaymentProps>('executepayment', executePayment);

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
//   quotesCollection,
//   transactionsCollection,
//   FIN_TRANSACTION_STATUS,
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
//       const quotesCollection = quotesCollection(db);

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

//       const ePayInstance = getEPayInstance(ePayCreds.value());
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
//               ? FIN_TRANSACTION_STATUS.PROCESSING
//               : FIN_TRANSACTION_STATUS.SUCCEEDED,
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
