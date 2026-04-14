import { onSchedule } from 'firebase-functions/scheduler';

export const computeportfolioexposure = onSchedule(
  { schedule: '0 2 * * *', timeZone: 'America/New_York' }, // daily at 02:00 ET
  async (event) => {
    await (await import('./computePortfolioExposure.js')).default(event);
  },
);
