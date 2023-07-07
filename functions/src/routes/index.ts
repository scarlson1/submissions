import * as functions from 'firebase-functions';

import {
  emailVerificationKey,
  firebaseHashConfig,
  // sendGridWebhookVerificationKey,
  sendgridApiKey,
} from '../common';

export const authRequests = functions
  .runWith({ secrets: [emailVerificationKey, firebaseHashConfig] })
  .https.onRequest(async (request, response) => {
    await (await import('./authRequests.js')).default(request, response);
  });

// sendGridWebhookVerificationKey
export const sendgrid = functions
  .runWith({ secrets: [sendgridApiKey] })
  .https.onRequest(async (request, response) => {
    await (await import('./sendgrid.js')).default(request, response);
  });

export const pubsubHelper = functions.https.onRequest(async (request, response) => {
  await (await import('./pubSubHelper.js')).default(request, response);
});
