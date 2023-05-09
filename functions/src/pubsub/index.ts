import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

// export { checkAchStatus } from './checkAchStatus.js';
// export { checkQuoteExpiration } from './checkQuoteExpiration.js';

// export const pubsubTopicFn = functions.pubsub.topic('topic').onPublish(async (message, context) => {
//   await (await import('./fn/pubsubTopicOnPublishFn')).default(message, context);
// });

export const ePayCreds = defineSecret('ENCODED_EPAY_AUTH');

export const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export const checkAchStatus = functions
  .runWith({ secrets: [ePayCreds] })
  // .pubsub.schedule('*/1 * * * *')
  // .pubsub.schedule('35 10 * * 1-5') // 10:35 monday-friday
  .pubsub.schedule('35 10 1-31 1-12 1-5')
  .onRun(async (context) => {
    await (await import('./checkAchStatus.js')).default(context);
  });

export const checkQuoteExpiration = functions
  .runWith({ secrets: [sendgridApiKey] })
  .pubsub.schedule('01 00 1-31 1-12 1-7') // 12:01 AM sun-sat
  .onRun(async (context) => {
    await (await import('./checkQuoteExpiration.js')).default(context);
  });

export const markpaidonpaymentcomplete = functions
  .runWith({ secrets: [sendgridApiKey] })
  .pubsub.topic('payment.complete')
  .onPublish(async (message, context) => {
    await (await import('./markPaidOnPaymentComplete.js')).default(message, context);
  });
