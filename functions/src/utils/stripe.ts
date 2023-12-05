import { error } from 'firebase-functions/logger';
import Stripe from 'stripe';

export async function getStripeCustomerByEmail(stripe: Stripe, email: string) {
  const customer = await stripe.customers.search({
    query: `email:'${email}'`,
  });
  if (!customer.data.length) throw new Error(`customer not found matching email ${email}`);
  return customer.data[0];
}

export async function getStripeCustomer(
  stripe: Stripe,
  cusId: string,
  createIfNotFound?: boolean,
  params?: Stripe.CustomerCreateParams
) {
  try {
    const cus = await stripe.customers.retrieve(cusId);
    if (cus.deleted && createIfNotFound) {
      return stripe.customers.create(params); // createStripeCustomer(stripe, params);
    }
    return cus;
  } catch (err: any) {
    if (createIfNotFound) return stripe.customers.create(params);
    error('error retrieving stripe customer', { ...err });
    throw err;
  }
}
