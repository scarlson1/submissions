import * as functions from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';

import {
  emailVerificationKey,
  exportSDKKey,
  firebaseHashConfig,
  quickbooksClientSecret,
  resendKey,
  resendSecret,
  // sendGridWebhookVerificationKey,
  sendgridApiKey,
  stripeSecretKey,
} from '../common/index.js';

// TODO: upgrade to v2 onRequest (need to get hosting rewrite to work b/c v2 uses cloud run & creates new url every deploy)

export const stripe = onRequest(
  { secrets: [stripeSecretKey] },
  async (request, response) => {
    await (await import('./stripe.js')).default(request, response);
  },
);

export const authRequests = functions
  .runWith({ secrets: [emailVerificationKey, firebaseHashConfig] })
  .https.onRequest(async (request, response) => {
    await (await import('./authRequests.js')).default(request, response);
  });

export const authrequeststest = onRequest(
  { secrets: [sendgridApiKey] },
  async (request, response) => {
    await (await import('./authRequestsv2Test.js')).default(request, response);
  },
);

export const copytaxes = functions.https.onRequest(
  async (request, response) => {
    await (await import('./copyTaxes.js')).default(request, response);
  },
);

export const generatepdf = onRequest(
  { secrets: [exportSDKKey] },
  async (request, response) => {
    await (await import('./generatePDF.js')).default(request, response);
  },
);

export const quickbooks = onRequest(
  { secrets: [quickbooksClientSecret] },
  async (request, response) => {
    await (await import('./quickbooks.js')).default(request, response);
  },
);

export const resend = onRequest(
  { secrets: [resendKey, resendSecret] },
  async (request, response) => {
    await (await import('./resend.js')).default(request, response);
  },
);

export const pubsubhelper = functions.https.onRequest(
  async (request, response) => {
    await (await import('./pubSubHelper.js')).default(request, response);
  },
);

export const typesensesetup = functions.https.onRequest(
  async (request, response) => {
    await (await import('./typesenseSetup.js')).default(request, response);
  },
);
