import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { getReportErrorFn, stripeSecretKey } from '../common/index.js';
import { getStripe } from '../services/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { validate } from './utils/index.js';

const reportErr = getReportErrorFn('fetchPaymentIntentSecret');

interface FetchPaymentIntentSecretProps {
  paymentIntentId: string;
}

const fetchPaymentIntentSecret = async ({
  data,
  auth,
}: CallableRequest<FetchPaymentIntentSecretProps>) => {
  const stripe = getStripe(stripeSecretKey.value());

  const { paymentIntentId } = data;
  validate(paymentIntentId, 'failed-precondition', 'paymentIntentId required');

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('PAYMENT INTENT: ', paymentIntent);

    // TODO: need to look up invoice to see if it's already been paid ??
    // https://docs.stripe.com/api/payment_intents/object

    return {
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    };
  } catch (err: any) {
    reportErr(
      `Error fetching client secret for payment intent ${paymentIntentId}`,
      { userId: auth?.uid || null },
      err,
    );
    throw new HttpsError(
      'unknown',
      `Error fetching payment intent ${paymentIntentId}`,
    );
  }
};

export default onCallWrapper<FetchPaymentIntentSecretProps>(
  'fetchPaymentIntentSecret',
  fetchPaymentIntentSecret,
);
