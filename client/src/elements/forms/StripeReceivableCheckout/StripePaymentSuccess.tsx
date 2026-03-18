import { Box, Typography } from '@mui/material';
import { useStripe } from '@stripe/react-stripe-js';
import { PaymentIntent } from '@stripe/stripe-js';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useSearchParams } from 'react-router-dom';

import { ErrorFallback } from 'components';
import { StripeElementsWrapper } from './StripeElementsWrapper';

// payment intent res: only use data is status/receipt email
// TODO: include receivable in url --> render details etc.
// or include invoice and fetch directly from stripe ??

const usePaymentIntentDetails = (clientSecret: string) => {
  const stripe = useStripe();

  const fetchPaymentIntentDetails = useCallback(
    async (secret: string) => {
      const result = await stripe?.retrievePaymentIntent(secret);
      if (result?.error) {
        console.log('TODO: handle error', result.error);
        throw new Error(result.error.message || 'Error retrieving payment details');
      }
      console.log(result);
      const paymentIntent = result?.paymentIntent;
      if (!paymentIntent) throw new Error(`Payment Intent not found`);
      console.log('paymentIntent: ', paymentIntent);
      return paymentIntent;
    },
    [stripe]
  );

  // return useSuspenseQuery<PaymentIntent>({
  //   queryKey: ['stripe', 'paymentIntents', clientSecret],
  //   queryFn: () => fetchPaymentIntentDetails(clientSecret),
  //   enabled: Boolean(clientSecret)
  // });
  return useQuery<PaymentIntent>({
    queryKey: ['stripe', 'paymentIntents', clientSecret],
    queryFn: () => fetchPaymentIntentDetails(clientSecret),
    enabled: Boolean(clientSecret) && stripe !== null,
  });
};

// TODO: separate ui from fetching payment info ??
// or just pass payment intent ID and use react query to fetch from stripe ??
interface StripePaymentIntentDetailsProps {
  clientSecret: string;
}

export const StripePaymentIntentDetails = ({ clientSecret }: StripePaymentIntentDetailsProps) => {
  const { data, isError, isLoading, isPending } = usePaymentIntentDetails(clientSecret);

  if (isLoading) return 'loading...';
  if (isPending) return 'pending...';
  if (isError) return 'error';

  // delete ?? throwing if not found ?? err boundary ??
  if (!data) return null;

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      // onReset={handleReset}
      // resetKeys={[data.paymentIntentId, clientSecret]}
    >
      <Box>
        <Typography variant='overline' gutterBottom>
          Status
        </Typography>
        <Typography variant='body2'>{data?.status}</Typography>
      </Box>

      <Box>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </Box>
    </ErrorBoundary>
  );
};

export const StripePaymentSuccess = () => {
  const [queryParams] = useSearchParams();
  const paymentIntent = queryParams.get('payment_intent');
  const clientSecret = queryParams.get('payment_intent_client_secret');

  if (!clientSecret) return null;
  console.log('pmt intent: ', paymentIntent, clientSecret);

  return (
    <StripeElementsWrapper clientSecret={clientSecret}>
      <PaymentStatus />
      <StripePaymentIntentDetails clientSecret={clientSecret} />
    </StripeElementsWrapper>
  );
};

const PaymentStatus = () => {
  const stripe = useStripe();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // Retrieve the "payment_intent_client_secret" query parameter appended to
    // your return_url by Stripe.js
    const clientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );
    if (!clientSecret) return;

    // Retrieve the PaymentIntent
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      // Inspect the PaymentIntent `status` to indicate the status of the payment
      // to your customer.
      //
      // Some payment methods will [immediately succeed or fail][0] upon
      // confirmation, while others will first enter a `processing` state.
      //
      // [0]: https://stripe.com/docs/payments/payment-methods#payment-notification
      if (!paymentIntent) return;
      switch (paymentIntent.status) {
        case 'succeeded':
          setMessage('Success! Payment received.');
          break;

        case 'processing':
          setMessage("Payment processing. We'll update you when payment is received.");
          break;

        case 'requires_payment_method':
          // Redirect your user back to your payment page to attempt collecting
          // payment again
          setMessage('Payment failed. Please try another payment method.');
          break;

        default:
          setMessage('Something went wrong.');
          break;
      }
    });
  }, [stripe]);

  return message;
};
