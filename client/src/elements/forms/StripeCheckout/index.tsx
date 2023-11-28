import { getFunctions } from 'firebase/functions';
import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { createPaymentIntent } from 'api';
import { ErrorFallback } from 'elements/forms/ClaimForm/ErrorFallback';
import { useSafeParams } from 'hooks';
import { usePrevious } from 'hooks/utils';
import { createResource, logDev } from 'modules/utils';
import { StripeElementsWrapper } from './StripeElementsWrapper';

function fetchPaymentIntent(quoteId: string, data: Record<string, any> = {}) {
  return createPaymentIntent(getFunctions(), { docId: quoteId, ...data }).then(
    ({ data }) => data.clientSecret
  );
}

export function createPmtIntent(quoteId: string, data: Record<string, any> = {}) {
  return createResource(fetchPaymentIntent(quoteId, data));
}

export default function () {
  const { quoteId } = useSafeParams(['quoteId']);
  const prevQuoteId = usePrevious(quoteId);
  const [pmtIntentResource, setPmtIntentResource] = useState<ReturnType<typeof createPmtIntent>>();

  useEffect(() => {
    if (!pmtIntentResource && quoteId !== prevQuoteId) {
      logDev('creating pmt intent resource...');
      setPmtIntentResource(createPmtIntent(quoteId, {}));
    }
  }, [quoteId, prevQuoteId, pmtIntentResource]);

  const handleReset = useCallback(
    () => setPmtIntentResource(createPmtIntent(quoteId, {})),
    [quoteId]
  );

  if (!pmtIntentResource) return null;

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={handleReset}
      resetKeys={[pmtIntentResource]}
    >
      <StripeElementsWrapper paymentIntentResource={pmtIntentResource} />
    </ErrorBoundary>
  );
}
