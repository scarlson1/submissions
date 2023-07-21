import * as functions from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';

import {
  emailVerificationKey,
  exportSDKKey,
  firebaseHashConfig,
  // sendGridWebhookVerificationKey,
  sendgridApiKey,
} from '../common';

// TODO: upgrade to v2 onRequest

export const authRequests = functions
  .runWith({ secrets: [emailVerificationKey, firebaseHashConfig] })
  .https.onRequest(async (request, response) => {
    await (await import('./authRequests.js')).default(request, response);
  });

export const generatepdf = onRequest({ secrets: [exportSDKKey] }, async (request, response) => {
  await (await import('./generatePDF.js')).default(request, response);
});

export const sendgrid = onRequest({ secrets: [sendgridApiKey] }, async (request, response) => {
  await (await import('./sendgrid.js')).default(request, response);
});

export const authrequeststest = onRequest(
  { secrets: [sendgridApiKey] },
  async (request, response) => {
    await (await import('./authRequestsv2Test.js')).default(request, response);
  }
);

export const pubsubHelper = functions.https.onRequest(async (request, response) => {
  await (await import('./pubSubHelper.js')).default(request, response);
});
