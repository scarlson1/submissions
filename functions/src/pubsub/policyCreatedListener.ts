import { DocumentReference, Timestamp, getFirestore } from 'firebase-admin/firestore';
import type { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info } from 'firebase-functions/logger';
import type { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import {
  Policy,
  policiesCollection,
  ratingDataCollection,
  transactionsCollection,
} from '../common';
// import { policyConverter } from '../common/converters/policy';

// Idempotent functions: https://cloud.google.com/blog/products/serverless/cloud-functions-pro-tips-building-idempotent-functions

// Use eventId in transaction
// Check whether trx exists in db (query: locationId && eventId OR use locationId+eventId as trx ID)
// Only return error if transient error (can't write to db, etc.)

// CREATES TRANSACTION FOR EACH LOCATION IN POLICY

export default async (event: CloudEvent<MessagePublishedData>) => {
  info('MSG JSON: ', event.data.message.json);
  // console.log('EVENT: ', JSON.stringify(event));
  const eventId = event.id;
  let policyId = null;
  try {
    policyId = event.data.message.json.policyId;
  } catch (e) {
    error('PubSub message was not JSON', e);
  }

  if (!policyId || typeof policyId !== 'string') {
    error(`Missing policy ID`, { policyId });
    // TODO: report error
    return;
  }
  info(`Policy Created - Policy ID: ${policyId}`, {
    eventId,
  });

  const db = getFirestore();
  // TODO: uncomment converter once policiesCollection is changed to new type
  const policyCol = policiesCollection(db); // .withConverter(policyConverter)
  const trxCol = transactionsCollection(db);

  const policyRef = policyCol.doc(policyId);
  let policy: Policy;

  try {
    let policySnap = await policyRef.get();
    policy = policySnap.data() as unknown as Policy;
    if (policySnap.exists || !policy) throw new Error('Policy not found');
  } catch (err: any) {
    error('Error retrieving policy', {
      errMsg: err?.message,
      eventId,
      policyId,
    });
    // TODO: report error
    return;
  }

  // TODO: SWITCH POLICIES COLLECTION TO USE NEW POLICY TYPE
  const locationIds = policy?.locations && Object.keys(policy.locations);
  if (!locationIds || !locationIds.length) {
    error('No policy data or no locations found in policy', {
      policyId,
      eventId,
    }); // TODO: report error
    return;
  }

  const trxTimestamp = Timestamp.now();
  const trxEffDate = policy?.effectiveDate;

  // TODO: remove || Timestamp once moved over to new Policy interface
  // TODO: get later of trx timestamp & trxEffDate (in this case, effectiveDate)
  for (let locationId of locationIds) {
    try {
      // const locationTrxQuery = trxCol
      //   .where('locationId', '==', locationId)
      //   .where('eventId', '==', eventId);
      const trxId = constructTrxId(policyId, locationId, eventId);
      const trxRef = trxCol.doc(trxId);

      if (!trxExists(trxRef)) {
        // TODO: use getLocation(id) once using converter
        const location = policy.locations[locationId];
        const bookingDateMillis = getBookingDate(
          location.effectiveDate.toMillis(),
          trxEffDate.toMillis()
        ); // later of trxEffDate

        // TODO: fetch rating data for premium calc fields
        const ratingSnap = await ratingDataCollection(db).doc(location.ratingDocId).get();

        const ratingData = ratingSnap.data();
        if (!ratingData) {
          const errMsg = `Missing rating data for location ${locationId}`;
          error(errMsg, {
            locationId,
            policyId,
            eventId,
          });

          throw new Error(errMsg);
        }

        trxRef.set({
          trxType: 'new',
          product: policy.product || '',
          policyId,
          term: policy.term,
          trxTimestamp,
          bookingDate: Timestamp.fromMillis(bookingDateMillis),
          issuingCarrier: policy?.issuingCarrier || '',
          namedInsured: policy?.namedInsured?.displayName, // (using new type)
          mailingAddress: policy.mailingAddress,
          locationId,
          externalId: location.externalId || null,
          insuredLocation: location,
          policyEffDate: policy?.effectiveDate,
          policyExpDate: policy?.expirationDate,
          trxEffDate: location?.effectiveDate || null,
          trxExpDate: location?.expirationDate || null,
          trxDays: 0, // TODO // trxExpDate - trxEffDate
          cancelEffDate: null,
          ratingPropertyData: {
            ...location.ratingPropertyData,
            units: 1, // TODO: get units from property data res
            tier1: false, // TODO: check if tier1
            construction: 'TODO',
            priorLossCount: 'TODO',
          }, // TODO: needs units, tier1, construction, priorLossCount
          deductible: location.deductible,
          limits: location.limits,
          TIV: location.TIV,
          RCVs: location.RCVs,
          premiumCalcData: ratingData.premiumCalcData,
          locationAnnualPremium: location.annualPremium,
          termProratedPct: 0, // TODO: Transaction days / policy days
          termPremium: 0, // TODO
          // 'TODO: store & fetch comm rate as doc in subcollection'
          MGACommission: 0, // ratingData.premiumCalcData., // TODO need to use atomic operation to store mga commission when saving policy
          // get mga commission from rating data
          // is this calced from value in subcollection ? stored in subcollection ? or does sub collection doc store commission on per location basis ? or store in rating data ??
          netDWP: 0, // TODO
          netErrorAdj: 0, // TODO
          dailyPremium: 0, // TODO
          otherInterestedParties: location.mortgageeInterest?.map((m) => m.name) || [], // includes mortgagee & additional interests - only need name for trx reporting
          // TODO: how is this different from additional named insured
          additionalNamedInsured: location.additionalInsureds?.map((ai) => ai.name) || [],
          // TODO: verify whether additional insureds should be stored separately from mortgagee
          // TODO: change ^ to displayName for consistency ??
          homeState: policy.homeState || '',
          eventId,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });
      }
    } catch (err: any) {
      error(`Error creating transaction for location ID ${locationId}`, {
        policyId,
        locationId,
        eventId,
      });
      // TODO: report error
    }
  }

  return;
};

// TODO: decide whether trxExists in necessary
// https://stackoverflow.com/a/59162013
// "Bear in mind that idempotency is not the same as parallelism. You don't need to worry about a function being invoked twice at the same time with the same event. There's no need to worry about "locking" anything to prevent this from happening. All you need to worry about is making sure that a second invocation of a function doesn't do anything incorrect beyond what the first successful invocation would do."

function trxExists(trxRef: DocumentReference) {
  return trxRef.get().then((snap) => snap.exists);
}

// IF USING QUERY METHOD
// function trxExists(query: Query) {
//   return query.get().then((snap) => !snap.empty);
// }

export function constructTrxId(policyId: string, locationId: string, eventId: string) {
  return `${policyId}-${locationId}-${eventId}`;
}

function getBookingDate(locationEffDateSeconds: number, trxEffDateSeconds: number) {
  return locationEffDateSeconds > trxEffDateSeconds ? locationEffDateSeconds : trxEffDateSeconds;
}

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
