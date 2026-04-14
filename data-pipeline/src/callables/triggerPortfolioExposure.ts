import type { CallableRequest } from 'firebase-functions/v2/https';
import { onCallWrapper } from '../utils/onCallWrapper.js';
import { requireIDemandAdminClaims } from './utils/auth.js';

const triggerPortfolioExposure = async ({ auth }: CallableRequest) => {
  requireIDemandAdminClaims(auth?.token);
  console.log('running portfolio exposure...');

  const runCore = (await import('../cron/computePortfolioExposure.js')).default;

  // ScheduledEvent is only used for event.jobName in the computedBy field.
  // We pass a minimal compatible object so the callable can share core logic
  // without duplicating the entire pipeline.
  const mockEvent = {
    scheduleTime: new Date().toISOString(),
    jobName: 'triggerPortfolioExposure/manual',
  };

  return await runCore(mockEvent as any);
};

export default onCallWrapper(
  'triggerPortfolioExposure',
  triggerPortfolioExposure,
);
