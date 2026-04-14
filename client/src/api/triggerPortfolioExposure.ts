import { Functions, httpsCallable } from 'firebase/functions';

export interface TriggerPortfolioExposureResponse {
  bucketCount: number;
  totalTiv: number;
  alertsRaised: number;
}

export const triggerPortfolioExposure = (functions: Functions) =>
  httpsCallable<void, TriggerPortfolioExposureResponse>(
    functions,
    'triggerportfolioexposure',
    // 'pipeline-triggerportfolioexposure',
  )();
