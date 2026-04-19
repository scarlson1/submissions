import { addDays, startOfToday, subDays } from 'date-fns';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { ScheduledEvent } from 'firebase-functions/v2/scheduler';

import { Quote, WithId } from '@idemand/common';
import {
  adminNotificationEmail,
  audience,
  hostingBaseURL,
  QUOTE_STATUS,
  quotesCollection,
  resendKey,
} from '../common/index.js';
import { sendQuoteExpiringSoonNotification } from '../services/sendgrid/index.js';

// TODO: test and finish function before deploy

// docs: https://cloud.google.com/scheduler/docs/tut-pub-sub

// NOTE: firestore timestamps stored in UTC
// https://firebase.google.com/docs/reference/node/firebase.firestore.Timestamp

// Send notification ??
//    - include -1 day and send email notification of 1-day expiry ??

// const resendKey = defineSecret('SENDGRID_API_KEY');

/**
 * Scheduled to run at 12:01 AM every day
 * Queries quotes with expiration dates +/- 1 day -->
 * updates status if expired
 * sends notification if expiring within 24 hours
 */

export default async (event: ScheduledEvent) => {
  info('CHECKING QUOTE STATUS FOR QUOTES EXPIRING IN THE NEXT 24 HOURS');
  const db = getFirestore();

  // let currentDate = new Date();
  // currentDate.setHours(0, 0, 0, 0);
  // TODO: FIX START OF DAY IS IN LOCAL TIME ZONE
  const currentDate = startOfToday();

  const startDate = subDays(currentDate, 1);
  const endDate = addDays(currentDate, 1);

  const quotesCollRef = quotesCollection(db);

  // TODO: ensure firestore index is created for query
  const q = quotesCollRef
    .where('quoteExpiration', '>=', startDate)
    .where('quoteExpiration', '<=', endDate);

  let quoteDocs: WithId<Quote>[] = [];
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
  } catch (err: any) {
    error('ERROR FETCHING QUOTES EXPIRING WITH 24 HOURS', { err });
    return;
  }

  const expired: WithId<Quote>[] = [];
  const expireIn24Hours: WithId<Quote>[] = [];

  try {
    const currDateSeconds = currentDate.getTime();
    for (const quote of quoteDocs) {
      const expTS = quote.quoteExpirationDate as Timestamp;
      if (
        expTS.toMillis() < currDateSeconds ||
        expTS.isEqual(Timestamp.fromDate(currentDate))
      ) {
        info(
          `QUOTE ${quote.id} expires ${expTS.toDate()} --> SETTING STATUS: EXPIRED`,
        );

        expired.push(quote);
      } else {
        info(
          `QUOTE ${quote.id} expires within 24 hours --> SENDING REMINDER EMAIL TO INSURED AND AGENT`,
        );

        expireIn24Hours.push(quote);
      }
    }
  } catch (err) {
    error(
      'ERROR SEPARATING EXPIRED QUOTES FROM QUOTES EXPIRING WITHIN 24 HOURS',
      { err },
    );
  }

  try {
    if (expired.length) {
      // TODO: update status for each doc
      for (const quote of expired) {
        const quoteRef = quotesCollRef.doc(quote.id);
        await quoteRef.update({
          status: QUOTE_STATUS.EXPIRED,
          'metadata.updated': Timestamp.now(),
        });
        console.log(
          `QUOTE ${quote.id} STATUS UPDATED TO "${QUOTE_STATUS.EXPIRED}"`,
        );
      }
    }
  } catch (err) {
    error('ERROR UPDATING STATUS TO EXPIRED: ', { err });
    // TODO: notify admins
  }

  try {
    if (expireIn24Hours.length) {
      // TODO: send notifications
      for (const quote of expireIn24Hours) {
        const to: string[] = [];
        if (quote.namedInsured?.email) to.push(quote.namedInsured?.email);
        if (quote.agent?.email) to.push(quote.agent?.email);
        if (
          audience.value() === 'DEV HUMANS' ||
          audience.value() === 'LOCAL HUMANS'
        ) {
          to.push(adminNotificationEmail.value());
        }

        if (to.length) {
          info(
            `Expires soon notification ${quote.id}. Notifying: ${JSON.stringify(to)}`,
          );

          const link = `${hostingBaseURL.value()}/quotes/${quote.id}`;

          const addressLine1 = quote.address?.addressLine1;

          await sendQuoteExpiringSoonNotification(
            resendKey.value(),
            to,
            link,
            addressLine1,
            undefined,
            // {
            //   customArgs: {
            //     emailType: 'quote_expiring',
            //   },
            // },
          );
        }
      }
    }
  } catch (err) {
    error('ERROR SENDING EXPIRES SOON NOTIFICATION: ', err);
  }
};
