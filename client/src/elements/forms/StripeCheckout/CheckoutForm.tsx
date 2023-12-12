import { LoadingButton } from '@mui/lab';
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { DefaultValuesOption, StripePaymentElementOptions } from '@stripe/stripe-js';
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

export function CheckoutForm({ billingDetails, emailReceipt }: CheckoutFormProps) {
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

    // not storing in url ?? pass as prop ?? added by sdk on submit ??
    const urlClientSecret = new URLSearchParams(window.location.search).get(
      'payment_intent_client_secret'
    );
    // console.log('URL CLIENT SECRET: ', urlClientSecret);

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
        // Make sure to change this to your payment completion page
        return_url: 'http://localhost:3000/admin/stripe-test/success', // TODO: REDIRECT TO PAYMENT SUCCEEDED
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

// export function StripeCheckoutFormServerExecution() {
//   const stripe = useStripe();
//   const elements = useElements();

//   const [errorMessage, setErrorMessage] = useState<string | undefined>();
//   const [loading, setLoading] = useState(false);

//   const handleServerResponse = async (response: any) => {
//     if (response.error) {
//       // Show error from server on payment form
//     } else if (response.status === 'requires_action') {
//       invariant(stripe);
//       // Use Stripe.js to handle the required next action
//       const { error, paymentIntent } = await stripe.handleNextAction({
//         clientSecret: response.clientSecret,
//       });

//       if (error) {
//         // Show error from Stripe.js in payment form
//       } else {
//         // Actions handled, show success message
//       }
//     } else {
//       // No actions needed, show success message
//     }
//   };

//   const handleError = (error: StripeError) => {
//     setLoading(false);
//     setErrorMessage(error?.message);
//   };

//   const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//     // We don't want to let default form submission happen here,
//     // which would refresh the page.
//     event.preventDefault();

//     if (!stripe) {
//       // Stripe.js hasn't yet loaded.
//       // Make sure to disable form submission until Stripe.js has loaded.
//       return;
//     }

//     setLoading(true);

//     // Trigger form validation and wallet collection
//     const { error: submitError } = await elements.submit();
//     if (submitError) {
//       handleError(submitError);
//       return;
//     }

//     // Create the PaymentMethod using the details collected by the Payment Element
//     const { error, paymentMethod } = await stripe.createPaymentMethod({
//       elements,
//       params: {
//         billing_details: {
//           name: 'Jenny Rose',
//         },
//       },
//     });

//     if (error) {
//       // This point is only reached if there's an immediate error when
//       // creating the PaymentMethod. Show the error to your customer (for example, payment details incomplete)
//       handleError(error);
//       return;
//     }

//     // Create the PaymentIntent
//     const res = await fetch('/create-confirm-intent', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         paymentMethodId: paymentMethod.id,
//       }),
//     });

//     const data = await res.json();

//     // Handle any next actions or errors. See the Handle any next actions step for implementation.
//     handleServerResponse(data);
//   };

//   // const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
//   //   // We don't want to let default form submission happen here,
//   //   // which would refresh the page.
//   //   event.preventDefault();

//   //   if (!stripe) {
//   //     // Stripe.js hasn't yet loaded.
//   //     // Make sure to disable form submission until Stripe.js has loaded.
//   //     return;
//   //   }

//   //   setLoading(true);

//   //   // Trigger form validation and wallet collection
//   //   const { error: submitError } = await elements!.submit();
//   //   if (submitError) {
//   //     handleError(submitError);
//   //     return;
//   //   }

//   // // Create the ConfirmationToken using the details collected by the Payment Element
//   // // and additional shipping information
//   // const { error, confirmationToken } = await stripe.createConfirmationToken({
//   //   elements,
//   //   params: {
//   //     shipping: {
//   //       name: 'Jenny Rose',
//   //       address: {
//   //         line1: '1234 Main Street',
//   //         city: 'San Francisco',
//   //         state: 'CA',
//   //         country: 'US',
//   //         postal_code: '94111',
//   //       },
//   //     },
//   //   },
//   // });

//   // if (error) {
//   //   // This point is only reached if there's an immediate error when
//   //   // creating the ConfirmationToken. Show the error to your customer (for example, payment details incomplete)
//   //   handleError(error);
//   //   return;
//   // }

//   //   // Create the PaymentIntent
//   //   const res = await fetch('/create-confirm-intent', {
//   //     method: 'POST',
//   //     headers: { 'Content-Type': 'application/json' },
//   //     body: JSON.stringify({
//   //       confirmationTokenId: confirmationToken.id,
//   //     }),
//   //   });

//   //   const data = await res.json();

//   //   // Handle any next actions or errors. See the Handle any next actions step for implementation.
//   //   handleServerResponse(data);
//   // };

//   return (
//     <form onSubmit={handleSubmit}>
//       <PaymentElement />
//       <button type='submit' disabled={!stripe || loading}>
//         Submit
//       </button>
//       {errorMessage && <div>{errorMessage}</div>}
//     </form>
//   );
// }
