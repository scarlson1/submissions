import { LoadingButton } from '@mui/lab';
import { Container, useColorScheme, useTheme } from '@mui/material';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import {
  Appearance,
  StripeElementsOptions,
  StripeError,
  StripePaymentElementOptions,
  loadStripe,
} from '@stripe/stripe-js';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import invariant from 'tiny-invariant';

import { createPaymentIntent } from 'api';
import { ErrorFallback } from 'elements/forms/ClaimForm/ErrorFallback';
import { getFunctions } from 'firebase/functions';
import { useSafeParams } from 'hooks';
import { usePrevious } from 'hooks/utils';
import { createResource, logDev } from 'modules/utils';
import { ErrorBoundary } from 'react-error-boundary';

// payment quick start: https://stripe.com/docs/payments/quickstart
// docs example: https://stripe.com/docs/payments/finalize-payments-on-the-server?platform=web&type=payment

function fetchPaymentIntent(quoteId: string, data: Record<string, any> = {}) {
  return createPaymentIntent(getFunctions(), { docId: quoteId, ...data }).then(
    ({ data }) => data.clientSecret
  );
}

export function createPmtIntent(quoteId: string, data: Record<string, any> = {}) {
  return createResource(fetchPaymentIntent(quoteId, data));
}

export const StripePmtIntentWrapper = () => {
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
      <StripePayment paymentIntentResource={pmtIntentResource} />
    </ErrorBoundary>
  );
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface StripePaymentProps {
  paymentIntentResource: ReturnType<typeof createPmtIntent>;
}

// TODO: use suspense for client secret instead of useEffect
export const StripePayment = ({ paymentIntentResource }: StripePaymentProps) => {
  // PRE_DEPLOY: use quote Id from params for testing
  // const { quoteId } = useSafeParams(['quoteId']);
  // const functions = useFunctions();
  // const [clientSecret, setClientSecret] = useState('');
  const { mode } = useColorScheme();
  const { palette, shape } = useTheme();
  const clientSecret = paymentIntentResource.read();

  // useEffect(() => {
  //   createPaymentIntent(functions, { docId: quoteId }).then(({ data }) => {
  //     console.log('Payment Intent Res: ', data);
  //     setClientSecret(data.clientSecret);
  //   });
  // }, [functions]);

  const appearance: Appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: palette.primary.main, // 'var(--idemand-palette-primary-main)', // '#0570de',
      colorBackground: palette.background.paper, // 'var(--idemand-palette-background-paper)', // '#ffffff',
      colorText: palette.text.primary, // 'var(--idemand-palette-text-secondary)', // '#30313d',
      colorTextSecondary: palette.text.secondary, // 'var(--idemand-palette-text-secondary)',
      colorTextPlaceholder: palette.text.tertiary,
      colorDanger: palette.error.main, // 'var(--idemand-palette-error-main)', // '#df1b41',
      colorWarning: palette.warning.main,
      colorSuccess: palette.success.main,
      fontFamily:
        'IBM Plex Sans,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol', // 'Ideal Sans, system-ui, sans-serif',
      spacingUnit: '4px', // spacing(1),
      borderRadius: `${shape.borderRadius}px`, // '10px', // 'var(--idemand-shape-borderRadius)', // '4px',
      // See all possible variables below
      logoColor: mode === 'dark' ? 'dark' : 'light',
      // iconColor
      // iconHoverColor
      // tabIconColor
      // tabIconHoverColor,
      // tabIconSelectedColor,
      // gridColumnSpacing
      // gridRowSpacing
      // tabSpacing
    },
  };

  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
  };

  // SERVER SIDE EXECUTION:
  // const options: StripeElementsOptions = {
  // mode: 'payment',
  // amount: 1099,
  // currency: 'usd',
  // paymentMethodCreation: 'manual',
  //   appearance: {
  //     /*...*/
  //   },
  // };

  return (
    <Container disableGutters maxWidth='sm'>
      {clientSecret && (
        <Elements stripe={stripePromise} options={options}>
          <StripeCheckoutForm clientSecret={clientSecret} />
        </Elements>
      )}
    </Container>
  );
};

export function StripeCheckoutForm({ clientSecret }: { clientSecret: string }) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    // not storing in url ?? pass as prop ?? added by sdk on submit ??
    const urlClientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );
    console.log('URL CLIENT SECRET: ', urlClientSecret);

    if (!urlClientSecret) {
      return;
    }

    stripe.retrievePaymentIntent(urlClientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent?.status) {
        case 'succeeded':
          setMessage('Payment succeeded!');
          break;
        case 'processing':
          setMessage('Your payment is processing.');
          break;
        case 'requires_payment_method':
          // setMessage('Your payment was not successful, please try again.');
          setMessage('Payment method required.');
          break;
        default:
          setMessage('Something went wrong.');
          break;
      }
    });
  }, [stripe]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: 'http://localhost:3000', // TODO: REDIRECT TO PAYMENT SUCCEEDED
        // payment_intent_client_secret is set as query param --> fetch intent to display status
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`. For some payment methods like iDEAL, your customer will
    // be redirected to an intermediate site first to authorize the payment, then
    // redirected to the `return_url`.
    if (error.type === 'card_error' || error.type === 'validation_error') {
      setMessage(error.message || 'an error occurred');
    } else {
      setMessage('An unexpected error occurred.');
    }

    setIsLoading(false);
  };

  const paymentElementOptions: StripePaymentElementOptions = {
    layout: 'tabs',
  };

  console.log('should be disabled: ', Boolean(!stripe || !elements));

  return (
    <form id='payment-form' onSubmit={handleSubmit}>
      <PaymentElement id='payment-element' options={paymentElementOptions} />
      <LoadingButton
        variant='contained'
        loading={isLoading}
        disabled={!stripe || !elements}
        fullWidth
        sx={{ my: 3 }}
        id='submit'
        type='submit'
      >
        Pay now
      </LoadingButton>
      {/* <button disabled={isLoading || !stripe || !elements} id='submit'>
        <span id='button-text'>
          {isLoading ? <div className='spinner' id='spinner'></div> : 'Pay now'}
        </span>
      </button> */}

      {message && <div id='payment-message'>{message}</div>}
    </form>
  );
}

export function StripeCheckoutFormServerExecution() {
  const stripe = useStripe();
  const elements = useElements();
  // invariant(stripe);
  invariant(elements);

  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  const handleServerResponse = async (response: any) => {
    if (response.error) {
      // Show error from server on payment form
    } else if (response.status === 'requires_action') {
      invariant(stripe);
      // Use Stripe.js to handle the required next action
      const { error, paymentIntent } = await stripe.handleNextAction({
        clientSecret: response.clientSecret,
      });

      if (error) {
        // Show error from Stripe.js in payment form
      } else {
        // Actions handled, show success message
      }
    } else {
      // No actions needed, show success message
    }
  };

  const handleError = (error: StripeError) => {
    setLoading(false);
    setErrorMessage(error?.message);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    // We don't want to let default form submission happen here,
    // which would refresh the page.
    event.preventDefault();

    if (!stripe) {
      // Stripe.js hasn't yet loaded.
      // Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setLoading(true);

    // Trigger form validation and wallet collection
    const { error: submitError } = await elements.submit();
    if (submitError) {
      handleError(submitError);
      return;
    }

    // Create the PaymentMethod using the details collected by the Payment Element
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      elements,
      params: {
        billing_details: {
          name: 'Jenny Rosen',
        },
      },
    });

    if (error) {
      // This point is only reached if there's an immediate error when
      // creating the PaymentMethod. Show the error to your customer (for example, payment details incomplete)
      handleError(error);
      return;
    }

    // Create the PaymentIntent
    const res = await fetch('/create-confirm-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethodId: paymentMethod.id,
      }),
    });

    const data = await res.json();

    // Handle any next actions or errors. See the Handle any next actions step for implementation.
    handleServerResponse(data);
  };

  // const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
  //   // We don't want to let default form submission happen here,
  //   // which would refresh the page.
  //   event.preventDefault();

  //   if (!stripe) {
  //     // Stripe.js hasn't yet loaded.
  //     // Make sure to disable form submission until Stripe.js has loaded.
  //     return;
  //   }

  //   setLoading(true);

  //   // Trigger form validation and wallet collection
  //   const { error: submitError } = await elements!.submit();
  //   if (submitError) {
  //     handleError(submitError);
  //     return;
  //   }

  // // Create the ConfirmationToken using the details collected by the Payment Element
  // // and additional shipping information
  // const { error, confirmationToken } = await stripe.createConfirmationToken({
  //   elements,
  //   params: {
  //     shipping: {
  //       name: 'Jenny Rosen',
  //       address: {
  //         line1: '1234 Main Street',
  //         city: 'San Francisco',
  //         state: 'CA',
  //         country: 'US',
  //         postal_code: '94111',
  //       },
  //     },
  //   },
  // });

  // if (error) {
  //   // This point is only reached if there's an immediate error when
  //   // creating the ConfirmationToken. Show the error to your customer (for example, payment details incomplete)
  //   handleError(error);
  //   return;
  // }

  //   // Create the PaymentIntent
  //   const res = await fetch('/create-confirm-intent', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       confirmationTokenId: confirmationToken.id,
  //     }),
  //   });

  //   const data = await res.json();

  //   // Handle any next actions or errors. See the Handle any next actions step for implementation.
  //   handleServerResponse(data);
  // };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type='submit' disabled={!stripe || loading}>
        Submit
      </button>
      {errorMessage && <div>{errorMessage}</div>}
    </form>
  );
}
