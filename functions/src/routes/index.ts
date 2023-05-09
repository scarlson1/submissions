import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

// export { authRequests } from './authRequests.js';

export const emailVerificationKey = defineSecret('EMAIL_VERIFICATION_KEY');

export const authRequests = functions
  .runWith({ secrets: [emailVerificationKey] })
  .https.onRequest(async (request, response) => {
    await (await import('./authRequests.js')).default(request, response);
  });

export const pubsubHelper = functions.https.onRequest(async (request, response) => {
  await (await import('./pubSubHelper.js')).default(request, response);
});
