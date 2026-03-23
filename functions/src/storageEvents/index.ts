import { onObjectFinalized } from 'firebase-functions/v2/storage';

import {
  googleGeoKey,
  resendKey,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common/index.js';

export const importpolicies = onObjectFinalized(
  { secrets: [resendKey], memory: '1GiB', timeoutSeconds: 540, concurrency: 1 },
  async (event) => {
    await (await import('./importPolicies.js')).default(event);
  },
);

export const importquotes = onObjectFinalized(
  { secrets: [resendKey] },
  async (event) => {
    await (await import('./importQuotes.js')).default(event);
  },
);

export const getfips = onObjectFinalized(
  { secrets: [googleGeoKey] },
  async (event) => {
    await (await import('./getFIPS.js')).default(event);
  },
);

export const importtransactions = onObjectFinalized(
  { secrets: [resendKey] },
  async (event) => {
    await (await import('./importTransactions.js')).default(event);
  },
);

export const rateportfolio = onObjectFinalized(
  {
    secrets: [
      swissReClientId,
      swissReClientSecret,
      swissReSubscriptionKey,
      resendKey,
    ],
    timeoutSeconds: 540, // 9 mins (max)
    memory: '1GiB',
    concurrency: 1,
  },
  async (event) => {
    await (await import('./ratePortfolio.js')).default(event);
  },
);
