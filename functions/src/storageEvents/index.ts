import { onObjectFinalized } from 'firebase-functions/v2/storage';

import {
  googleGeoKey,
  sendgridApiKey,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common/index.js';

export const importpolicies = onObjectFinalized({ secrets: [sendgridApiKey] }, async (event) => {
  await (await import('./importPolicies.js')).default(event);
});

export const importquotes = onObjectFinalized({ secrets: [sendgridApiKey] }, async (event) => {
  await (await import('./importQuotes.js')).default(event);
});

export const getfips = onObjectFinalized({ secrets: [googleGeoKey] }, async (event) => {
  await (await import('./getFIPS.js')).default(event);
});

export const importtransactions = onObjectFinalized(
  { secrets: [sendgridApiKey] },
  async (event) => {
    await (await import('./importTransactions.js')).default(event);
  }
);

export const rateportfolio = onObjectFinalized(
  {
    secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey, sendgridApiKey],
    timeoutSeconds: 540, // 9 mins (max)
    memory: '1GiB',
    concurrency: 1,
  },
  async (event) => {
    await (await import('./ratePortfolio.js')).default(event);
  }
);
