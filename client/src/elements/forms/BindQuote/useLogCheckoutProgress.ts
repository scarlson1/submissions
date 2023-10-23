import { ANALYTICS_EVENTS } from 'common';
import { useAnalyticsEvent } from 'hooks';
import { useCallback, useState } from 'react';

export function useLogCheckoutProgress(quoteId: string, stepCount: number) {
  const [steps, setSteps] = useState(Array(stepCount).fill(false));
  // const { quoteId } = useParams();
  const logEvent = useAnalyticsEvent();

  const logStep = useCallback(
    (step: number, stepName?: string) => {
      const hasBeenLogged = !!steps[step];
      if (hasBeenLogged || !quoteId) return;

      logEvent(ANALYTICS_EVENTS.CHECKOUT_PROGRESS, {
        checkout_step: step,
        quoteId: quoteId,
        page_location: window.location.href,
        page_path: window.location.pathname,
        stepName,
      });

      setSteps((prev) => {
        const newVal = [...prev];
        newVal[step] = true;
        return newVal;
      });
    },
    [logEvent, quoteId, steps]
  );

  return logStep;
}
