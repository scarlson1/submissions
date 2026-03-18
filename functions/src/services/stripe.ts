import Stripe from 'stripe';

let stripeRef: Stripe | undefined;

export function getStripe(secretKey: string, config?: Stripe.StripeConfig | undefined) {
  if (stripeRef) return stripeRef;
  let newInstance = new Stripe(secretKey, config);
  stripeRef = newInstance;
  return newInstance;
}
