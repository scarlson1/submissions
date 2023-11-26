import Stripe from 'stripe';

let stripeRef: Stripe | undefined;

export function getStripe(secretKey: string) {
  if (stripeRef) return stripeRef;
  let newInstance = new Stripe(secretKey);
  stripeRef = newInstance;
  return newInstance;
}
