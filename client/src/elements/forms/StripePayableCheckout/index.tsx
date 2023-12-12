import { useSuspenseQuery } from '@tanstack/react-query';
import { getFunctions } from 'firebase/functions';
import { ErrorBoundary } from 'react-error-boundary';

import { fetchPaymentIntentSecret } from 'api';
import { Payable, WithId } from 'common';
import { ErrorFallback } from 'components';
import { StripeElementsWrapper } from './StripeElementsWrapper';

// REPLACE StripeCheckout WITH THIS COMPONENT ?? should serve as wrapper to pass payment intent from payable
// pass in payable --> fetch payable --> fetch payment intent client secret from api

// need to pass payment options ??
function fetchStripeSecret(paymentIntentId: string) {
  return fetchPaymentIntentSecret(getFunctions(), { paymentIntentId }).then(
    ({ data }) => data.clientSecret
  );
}

const usePaymentIntentSecret = (paymentIntent: string) => {
  return useSuspenseQuery({
    queryKey: ['stripe', paymentIntent, 'secret'],
    queryFn: () => fetchStripeSecret(paymentIntent),
  });
};

// move payable state up to parent component
// parent show location details in drawer (collapsed on small screen)

interface StripePayableCheckoutProps {
  data: WithId<Payable>;
}

export default function ({ data }: StripePayableCheckoutProps) {
  if (!data.paymentIntentId) throw new Error('missing payment intent'); // TODO: handle in error boundary
  const { data: clientSecret } = usePaymentIntentSecret(data.paymentIntentId);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      // onReset={handleReset}
      resetKeys={[data.paymentIntentId, clientSecret]}
    >
      <StripeElementsWrapper
        clientSecret={clientSecret}
        emailReceipt={data.billingEntityDetails?.email || ''}
        billingDetails={{
          email: data.billingEntityDetails?.email || '',
          name: data.billingEntityDetails?.name || '',
          phone: data.billingEntityDetails?.phone || '',
          // address: data.billingEntityDetails?.address || ''
        }}
      />
    </ErrorBoundary>
  );
}
