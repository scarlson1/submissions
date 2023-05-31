import * as functions from 'firebase-functions';

import { emailVerificationKey } from '../common';

export const authRequests = functions
  .runWith({ secrets: [emailVerificationKey] })
  .https.onRequest(async (request, response) => {
    await (await import('./authRequests.js')).default(request, response);
  });

export const pubsubHelper = functions.https.onRequest(async (request, response) => {
  await (await import('./pubSubHelper.js')).default(request, response);
});
