import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import type { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info } from 'firebase-functions/logger';
import type { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { transactionsCollection } from '../common';
import {
  constructTrxId,
  fetchPolicyData,
  fetchRatingData,
  formatPremiumTrx,
  trxExists,
} from '../utils/transactions';
import { reportErrorSentry } from '../services/sentry';

// using JS Module over classes: https://dev.to/giantmachines/stop-using-javascript-classes-33ij

// Idempotent functions: https://cloud.google.com/blog/products/serverless/cloud-functions-pro-tips-building-idempotent-functions

// Only return error if transient error (can't write to db, etc.)

// CREATES TRANSACTION FOR EACH LOCATION IN NEW POLICY

interface PolicyCreatedPayload {
  policyId: string;
}

export default async (event: CloudEvent<MessagePublishedData<PolicyCreatedPayload>>) => {
  info('POLICY CREATED EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  const eventId = event.id;
  let policyId = null;
  try {
    // TODO: is try/catch necessary ??
    policyId = event.data?.message?.json?.policyId;
  } catch (e) {
    error('PubSub message was not JSON', e);
  }

  if (!policyId || typeof policyId !== 'string') {
    reportError(`Missing policy ID`, { policyId });
    return;
  }

  const db = getFirestore();
  const trxCol = transactionsCollection(db);

  const policy = await fetchPolicyData(db, policyId);
  if (!policy) {
    reportError(`Policy not found. Returning early.`, { policyId });
    return;
  }

  const locationEntries = policy?.locations && Object.entries(policy.locations);
  if (!locationEntries || !locationEntries.length) {
    reportError('No policy locations found in policy', { policyId });
    return;
  }

  const trxTimestamp = Timestamp.now(); // just so created ts matches for all locations

  for (let [locationId, location] of locationEntries) {
    try {
      const trxId = constructTrxId(policyId, locationId, eventId);
      const trxRef = trxCol.doc(trxId);

      if (!trxExists(trxRef)) {
        const ratingData = await fetchRatingData(db, location.ratingDocId);

        // TODO: handle validation
        // TODO: handle scenarios where rating doc not available (imported policies)

        // TODO: trxEffDate = location eff date (not trxTimestamp) - need to verify
        const locationTrx = formatPremiumTrx(
          'new',
          policy,
          location,
          ratingData,
          policyId,
          eventId,
          trxTimestamp
        );

        await trxRef.set({ ...locationTrx });
        // await trxRef.set({
        //   trxType: 'new',
        //   product: policy.product || '',
        //   policyId,
        //   term: policy.term,
        //   trxTimestamp,
        //   bookingDate: Timestamp.fromMillis(bookingDateMillis),
        //   issuingCarrier: policy?.issuingCarrier || '',
        //   namedInsured: policy?.namedInsured?.displayName,
        //   mailingAddress: policy.mailingAddress,
        //   locationId,
        //   externalId: location.externalId || null,
        //   insuredLocation: location,
        //   policyEffDate: policy?.effectiveDate,
        //   policyExpDate: policy?.expirationDate,
        //   trxEffDate: location?.effectiveDate || null,
        //   trxExpDate: location?.expirationDate || null,
        //   trxDays: location.termDays,
        //   cancelEffDate: null,
        //   ratingPropertyData: {
        //     ...location.ratingPropertyData,
        //     units: null,
        //     tier1: null,
        //     construction: '',
        //     priorLossCount: location.ratingPropertyData?.priorLossCount ?? null,
        //   }, // TODO: needs units, tier1, construction from property res
        //   deductible: location.deductible,
        //   limits: location.limits,
        //   TIV: location.TIV,
        //   RCVs: location.RCVs,
        //   premiumCalcData: ratingData.premiumCalcData,
        //   locationAnnualPremium: location.annualPremium,
        //   termProratedPct,
        //   termPremium: location.termPremium,
        //   MGACommission: ratingData?.premiumCalcData?.MGACommission,
        //   MGACommissionPct: ratingData.premiumCalcData?.MGACommissionPct,
        //   // get mga commission from rating data
        //   // is this calced from value in subcollection ? stored in subcollection ? or does sub collection doc store commission on per location basis ? or store in rating data ??
        //   netDWP: calcNetDWP(location.termPremium, ratingData?.premiumCalcData?.MGACommission || 0),
        //   netErrorAdj: 0, // TODO
        //   dailyPremium: round(location.termPremium / location.termDays, 2),
        //   otherInterestedParties: location.mortgageeInterest?.map((m) => m.name) || [],
        //   additionalNamedInsured: location.additionalInsureds?.map((ai) => ai.name) || [],
        //   homeState: policy.homeState || '',
        //   eventId,
        //   metadata: {
        //     created: Timestamp.now(),
        //     updated: Timestamp.now(),
        //   },
        // });
        info(`New transaction saved for location ${locationId}`, { locationTrx });
      }
    } catch (err: any) {
      // error(`Error creating transaction for location ID ${locationId}`, {
      //   policyId,
      //   locationId,
      //   eventId,
      // });
      // reportErrorSentry(err, { func: 'policyCreatedListener', policyId, locationId });
      reportError(
        `Error creating transaction for location ID ${locationId}`,
        { policyId, locationId },
        err
      );
    }
  }

  return;
};

export function reportError(msg: string, ctx: Record<string, any> = {}, err: any = null) {
  error(msg, { ...ctx, err });
  reportErrorSentry(err || msg, { func: 'policyCreatedListener', msg, ...ctx });
}

// TODO: decide whether trxExists in necessary
// https://stackoverflow.com/a/59162013
// "Bear in mind that idempotency is not the same as parallelism. You don't need to worry about a function being invoked twice at the same time with the same event. There's no need to worry about "locking" anything to prevent this from happening. All you need to worry about is making sure that a second invocation of a function doesn't do anything incorrect beyond what the first successful invocation would do."

// Idempotent example:

// EXAMPLE 1:
// const db = admin.firestore();

// exports.idempotentFirestoreFunction = (event) => {
//   const message = event.data;
//   const content =
//       JSON.parse(Buffer.from(message.data || '', 'base64').toString() || '{}');
//   const eventId = event.context.eventId;
//   return db.collection('contents').doc(eventId).set(content).then(() => {
//     return request({
//       method: 'POST', uri: `https://api.myservice.com/upload/${eventId}`,
//       body: content, json: true
//     });
//   });
// };

// EXAMPLE 2:
// const sgMail = require('@sendgrid/mail');

// exports.almostIdempotentEmailFunction = (event) => {
//   const content = ...;
//   const eventId = event.context.eventId;
//   const emailRef = db.collection('sentEmails').doc(eventId);

//   return shouldSend(emailRef).then(send => {
//     if (send) {
//       // Send email.
//       sgMail.setApiKey(...);
//       sgMail.send({..., text: content.text});
//       return markSent(emailRef);
//     }
//   }).then(() => {
//     // Call another service.
//     // ...
//   });
// };

// // ...
// const db = admin.firestore();

// function shouldSend(emailRef) {
//   return emailRef.get().then(emailDoc => {
//     return !emailDoc.exists || !emailDoc.data().sent;
//   });
// }

// function markSent(emailRef) {
//   return emailRef.set({sent: true});
// }

// EXAMPLE 3: use firestore transaction to 'lease'
// const sgMail = require('@sendgrid/mail');

// exports.idempotentEmailFunction = (event) => {
//   const content = ...;
//   const eventId = event.context.eventId;
//   const emailRef = db.collection('sentEmails').doc(eventId);

//   return shouldSendWithLease(emailRef).then(send => {
//     if (send) {
//       // Send email.
//       sgMail.setApiKey(...);
//       sgMail.send({..., text: content.text});
//       return markSent(emailRef);
//     }
//   }).then(() => {
//     // Call another service.
//     // ...
//   });
// };

// // ...
// const leaseTime = 60 * 1000; // 60s

// function shouldSendWithLease(emailRef) {
//   return db.runTransaction(transaction => {
//     return transaction.get(emailRef).then(emailDoc => {
//       if (emailDoc.exists && emailDoc.data().sent) {
//         return false;
//       }
//       if (emailDoc.exists && admin.firestore.Timestamp.now() < emailDoc.data().lease) {
//         return Promise.reject('Lease already taken, try later.');
//       }
//       transaction.set(
//           emailRef, {lease: new Date(new Date().getTime() + leaseTime)});
//       return true;
//     });
//   });
// }

// function markSent(emailRef) {
//   return emailRef.set({sent: true});
// }
