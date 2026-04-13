import { useSuspenseQuery } from '@tanstack/react-query';
import { getFunctions } from 'firebase/functions';
import { ErrorBoundary } from 'react-error-boundary';

import type { Receivable, WithId } from '@idemand/common';
import { fetchPaymentIntentSecret } from 'api';
import { ErrorFallback } from 'components';
import { CheckoutForm } from '../StripeCheckout/CheckoutForm';
import { StripeElementsWrapper } from './StripeElementsWrapper';

// need to pass payment options ??
function fetchStripeSecret(paymentIntentId: string) {
  return fetchPaymentIntentSecret(getFunctions(), { paymentIntentId }).then(
    ({ data }) => data.clientSecret,
  );
}

const usePaymentIntentSecret = (paymentIntent: string) => {
  return useSuspenseQuery({
    queryKey: ['stripe', paymentIntent, 'secret'],
    queryFn: () => fetchStripeSecret(paymentIntent),
  });
};

// move receivable state up to parent component
// parent show location details in drawer (collapsed on small screen)

interface StripeReceivableCheckoutProps {
  data: WithId<Receivable>;
}

export default function ({ data }: StripeReceivableCheckoutProps) {
  // TODO: don't throw ?? handle error case - may be situations where invoice needs to be recreated (void, marked un-collectable, etc.) ??
  if (!data.paymentIntentId) throw new Error('missing payment intent'); // TODO: handle in error boundary
  const { data: clientSecret } = usePaymentIntentSecret(data.paymentIntentId);

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      // onReset={handleReset}
      resetKeys={[data.paymentIntentId, clientSecret]}
    >
      <StripeElementsWrapper clientSecret={clientSecret}>
        <CheckoutForm
          emailReceipt={data.billingEntityDetails?.email || ''}
          billingDetails={{
            email: data.billingEntityDetails?.email || '',
            name: data.billingEntityDetails?.name || '',
            phone: data.billingEntityDetails?.phone || '',
          }}
        />
      </StripeElementsWrapper>
    </ErrorBoundary>
  );
}
