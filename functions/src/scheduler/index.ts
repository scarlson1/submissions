import { onSchedule } from 'firebase-functions/v2/scheduler';

import { ePayCreds, resendKey } from '../common/index.js';

export const checkachstatus = onSchedule(
  { schedule: '35 10 1-31 1-12 1-5', secrets: [ePayCreds] },
  async (event) => {
    await (await import('../scheduler/checkAchStatus.js')).default(event);
  },
);

export const checkquoteexpiration = onSchedule(
  { schedule: '01 00 1-31 1-12 1-7', secrets: [resendKey] },
  async (event) => {
    await (await import('./checkQuoteExpiration.js')).default(event);
  },
);

// Runs at 6:00 AM UTC daily — manages the full renewal lifecycle
export const checkrenewalstatus = onSchedule(
  { schedule: '00 06 1-31 1-12 1-7', secrets: [resendKey] },
  async (event) => {
    await (await import('./checkRenewalStatus.js')).default(event);
  },
);
