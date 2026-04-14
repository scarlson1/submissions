import { onSchedule } from 'firebase-functions/scheduler';

export const computeportfolioexposure = onSchedule(
  { schedule: '0 2 * * *', timeZone: 'America/New_York' }, // daily at 02:00 ET
  async (event) => {
    await (await import('./computePortfolioExposure.js')).default(event);
  },
);

// Runs at 3:30 AM ET, after the portfolio job at 2 AM.
export const reconciletaxtransactions = onSchedule(
  { schedule: '30 3 * * *', timeZone: 'America/New_York' },
  async (event) => {
    await (await import('./reconcileTaxTransactions.js')).default(event);
  },
);

// Runs at 4 AM ET,
export const syncagentfunneltofirestore = onSchedule(
  { schedule: '0 4 * * 0', timeZone: 'America/New_York' },
  async (event) => {
    await (await import('./syncAgentFunnelToFirestore.js')).default(event);
  },
);
