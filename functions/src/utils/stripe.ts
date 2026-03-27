import { error } from 'firebase-functions/logger';
import Stripe from 'stripe';

async function getStripeCustomerByEmail(stripe: Stripe, email: string) {
  const customers = await stripe.customers.search({
    query: `email:'${email}'`,
  });
  if (!customers.data.length)
    throw new Error(`customer not found matching email ${email}`);
  return customers;
}

export async function getActiveStripeCustomerByEmail(
  stripe: Stripe,
  email: string,
) {
  const customers = await getStripeCustomerByEmail(stripe, email);
  // could have multiple customers with same email if deleted
  const activeCustomers = customers.data.filter((c) => !(c as any).deleted);
  if (!activeCustomers.length) throw new Error('customer deleted');
  return activeCustomers[0];
}

export async function getStripeCustomer(
  stripe: Stripe,
  cusId: string,
  createIfNotFound?: boolean,
  params?: Stripe.CustomerCreateParams,
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
