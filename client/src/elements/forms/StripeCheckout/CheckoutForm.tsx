import { LoadingButton } from '@mui/lab';
import {
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import {
  DefaultValuesOption,
  StripePaymentElementOptions,
} from '@stripe/stripe-js';
import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// use named insured as default billing details ??
// or only provide if current user === named insured ??
// can agent complete checkout form providing email with new payment method ??
// conditionally display Link element (only if billing details provided - only provided if not agent) ??
interface CheckoutFormProps {
  // clientSecret: string;
  billingDetails?: DefaultValuesOption['billingDetails'];
  emailReceipt: string;
}

export function CheckoutForm({
  billingDetails,
  emailReceipt,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();

  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // const [link, setLink] = useState({
  //   complete: false,
  //   email: '',
  // });
  // const [emailComplete, setEmailComplete] = useState(false);
  const [pmtElReady, setPmtElReady] = useState(false);

  // TODO: move to it's own component ??
  useEffect(() => {
    if (!stripe) {
      return;
    }

    const urlClientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret',
    );

    if (!urlClientSecret) return;

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
    console.log('submit called');

    // if (!stripe || !elements || !link.email || !link.complete) {
    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded. Make sure to disable form submission until Stripe.js has loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // TODO: success url - include receivable ID in params
        return_url: 'http://localhost:3000/admin/stripe-test/success',
        // payment_intent_client_secret is set as query param --> fetch intent to display status
        receipt_email: emailReceipt, // || link.email, // email,
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
    defaultValues: {
      billingDetails: {
        name: billingDetails?.name || '', // default to named insured or current user ??
        email: billingDetails?.email || '',
        phone: billingDetails?.phone || '',
      },
    },
    paymentMethodOrder: ['us_bank_account', 'bank_transfer'],
  };

  return (
    <form id='payment-form' onSubmit={handleSubmit}>
      {/* <LinkAuthenticationElement
        onChange={(e) => {
          // e.complete && setEmailComplete(true);
          e.complete &&
            setLink({
              complete: true,
              email: e.value.email,
            });
        }}
      />
      <Divider sx={{ my: 3 }} /> */}
      <PaymentElement
        id='payment-element'
        options={paymentElementOptions}
        onReady={() => {
          console.log('payment element ready');
          setPmtElReady(true);
        }}
        onLoadError={({ elementType, error: err }) => {
          console.log('load err: ', err);
          toast.error(err.message || 'error loading Stripe');
        }}
      />
      <LoadingButton
        variant='contained'
        loading={isLoading || !pmtElReady}
        // disabled={!stripe || !elements || !link.complete}
        disabled={!stripe || !elements}
        fullWidth
        sx={{ my: 3 }}
        id='submit'
        type='submit'
      >
        Pay now
      </LoadingButton>

      {message && <div id='payment-message'>{message}</div>}
    </form>
  );
}
