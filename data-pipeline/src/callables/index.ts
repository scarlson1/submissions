import { onCall } from 'firebase-functions/https';

export const triggerportfolioexposure = onCall(async (request) => {
  return (await import('./triggerPortfolioExposure.js')).default(request);
});
