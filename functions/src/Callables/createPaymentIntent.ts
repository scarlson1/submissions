import { getFirestore } from 'firebase-admin/firestore';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { round } from 'lodash-es';
import invariant from 'tiny-invariant';
import { getReportErrorFn, quotesCollection, stripeSecretKey } from '../common/index.js';
import { getStripe } from '../services/index.js';
import { onCallWrapper } from '../services/sentry/onCallWrapper.js';
import { validate } from './utils/validation.js';

const reportErr = getReportErrorFn('createPaymentIntent');

function calculateOrderAmount(dollarAmt: number) {
  return round(dollarAmt * 100);
}

interface CreatePaymentIntentProps {
  colName: string;
  docId: string;
}

const createPaymentIntent = async ({ data, auth }: CallableRequest<CreatePaymentIntentProps>) => {
  let stripe = getStripe(stripeSecretKey.value());

  // requireAuth ??

  const { docId } = data; // colName,
  validate(docId, 'failed-precondition', 'docId required');

  const db = getFirestore();
  const colRef = quotesCollection(db); // TODO: use colName ?? need to extract total depending on collection source

  const snap = await colRef.doc(docId).get();
  const quote = snap.data();
  validate(snap.exists && quote, 'not-found', `quote not found with ID ${docId}`);

  // TODO: split by billing entity
  // const amount = quote.billingEntities
  const amount = quote.quoteTotal;
  if (!amount || typeof amount !== 'number')
    reportErr('error creating payment intent - invalid quote total', { data, auth, quote });
  validate(
    amount && typeof amount === 'number',
    'failed-precondition',
    'Quote is missing total amount due'
  ); // TODO: use user friendly message ??

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: calculateOrderAmount(amount), // items
      currency: 'usd',
      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });
    invariant(paymentIntent.client_secret);

    return { clientSecret: paymentIntent.client_secret };
  } catch (err: any) {
    throw new HttpsError('internal', 'Error communicating with our payment processor');
  }
};

export default onCallWrapper<CreatePaymentIntentProps>('createPaymentIntent', createPaymentIntent);
