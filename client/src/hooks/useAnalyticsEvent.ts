import { useCallback } from 'react';
import { useAnalytics } from 'reactfire';
import { AnalyticsCallOptions, EventNameString, EventParams, logEvent } from 'firebase/analytics';

export const useAnalyticsEvent = (options?: AnalyticsCallOptions | undefined) => {
  const analytics = useAnalytics();

  return useCallback(
    (eventName: EventNameString | string, eventParams: EventParams) => {
      if (!analytics) return console.log('analytics missing. event not logged.');
      try {
        logEvent(analytics, eventName, eventParams, options);
      } catch (err) {
        console.log('Error reporting event: ', err);
      }
    },
    [analytics, options]
  );
};
