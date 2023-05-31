import { ScheduledEvent } from 'firebase-functions/v2/scheduler';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { addDays, subDays, startOfToday } from 'date-fns';

import {
  QUOTE_STATUS,
  SubmissionQuoteData,
  WithId,
  submissionsQuotesCollection,
  audience,
  hostingBaseURL,
  sendgridApiKey,
} from '../common';
import { sendQuoteExpiringSoonNotification } from '../services/sendgrid';

// TODO: test and finish function before deploy

// docs: https://cloud.google.com/scheduler/docs/tut-pub-sub

// NOTE: firestore timestamps stored in UTC
// https://firebase.google.com/docs/reference/node/firebase.firestore.Timestamp

// Send notification ??
//    - include -1 day and send email notification of 1-day expiry ??

// const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

/**
 * Scheduled to run at 12:01 AM every day
 * Queries quotes with expiration dates +/- 1 day -->
 * updates status if expired
 * sends notification if expiring within 24 hours
 */

export default async (event: ScheduledEvent) => {
  console.log('CHECKING QUOTE STATUS FOR QUOTES EXPIRING IN THE NEXT 24 HOURS');
  const db = getFirestore();

  // let currentDate = new Date();
  // currentDate.setHours(0, 0, 0, 0);
  // TODO: FIX START OF DAY IS IN LOCAL TIME ZONE
  let currentDate = startOfToday();

  const startDate = subDays(currentDate, 1);
  const endDate = addDays(currentDate, 1);

  const quotesCollRef = submissionsQuotesCollection(db);

  // TODO: ensure firestore index is created for query
  const q = quotesCollRef
    .where('quoteExpiration', '>=', startDate)
    .where('quoteExpiration', '<=', endDate);

  let quoteDocs: WithId<SubmissionQuoteData>[] = [];
  try {
    const querySnap = await q.get();
    if (querySnap.empty) {
      console.log('No docs found with expirationDate within +/- 1 day');
      return;
    }

    quoteDocs = querySnap.docs.map((s) => ({
      ...s.data(),
      id: s.id,
    }));

    // quoteDocs.forEach(q => console.log(`QUOTE ${q.id} expires ${new Date(q.quoteExpiration.seconds * 1000).toString()}`))
  } catch (err) {
    console.log('ERROR FETCHING QUOTES EXPIRING WITH 24 HOURS');
  }

  let expired = [];
  let expireIn24Hours = [];

  try {
    let currDateSeconds = currentDate.getTime();
    for (const quote of quoteDocs) {
      let expTS = quote.quoteExpiration as Timestamp;
      if (expTS.toMillis() < currDateSeconds || expTS.isEqual(Timestamp.fromDate(currentDate))) {
        console.log(`QUOTE ${quote.id} expires ${expTS.toDate()} --> SETTING STATUS: EXPIRED`);

        expired.push(quote);
      } else {
        console.log(
          `QUOTE ${quote.id} expires within 24 hours --> SENDING REMINDER EMAIL TO INSURED AND AGENT`
        );

        expireIn24Hours.push(quote);
      }
    }
  } catch (err) {
    console.log('ERROR SEPARATING EXPIRED QUOTES FROM QUOTES EXPIRING WITHIN 24 HOURS');
  }

  try {
    if (expired.length) {
      // TODO: update status for each doc
      for (const quote of expired) {
        let quoteRef = quotesCollRef.doc(quote.id);
        await quoteRef.update({ status: QUOTE_STATUS.EXPIRED });
        console.log(`QUOTE ${quote.id} STATUS UPDATED TO "${QUOTE_STATUS.EXPIRED}"`);
      }
    }
  } catch (err) {
    console.log('ERROR UPDATING STATUS TO EXPIRED: ', err);
    // TODO: notify admins
  }

  try {
    if (expireIn24Hours.length) {
      // TODO: send notifications
      for (const quote of expireIn24Hours) {
        let to = [];
        if (quote.insuredEmail) to.push(quote.insuredEmail);
        if (quote.agentEmail) to.push(quote.agentEmail);
        if (audience.value() === 'DEV HUMANS' || audience.value() === 'LOCAL HUMANS') {
          to.push('spencer.carlson@idemandinsurance.com');
        }

        if (to.length) {
          console.log(`Expires soon notification ${quote.id}. Notifying: ${to}`);

          const link = `${hostingBaseURL.value()}/quotes/${quote.id}`;

          const addressLine1 = quote.insuredAddress.addressLine1;

          await sendQuoteExpiringSoonNotification(sendgridApiKey.value(), to, link, addressLine1);
        }
      }
    }
  } catch (err) {
    console.log('ERROR SENDING EXPIRES SOON NOTIFICATION: ', err);
  }
};
