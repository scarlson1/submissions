import { BillingEntity, Collection, Quote } from '@idemand/common';
import { DocumentReference, UpdateData, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { stripeSecretKey } from '../common/environmentVars.js';
import { getReportErrorFn } from '../common/helpers.js';
import { onCallWrapper } from '../services/sentry/onCallWrapper.js';
import { getStripe } from '../services/stripe.js';
import { getActiveStripeCustomerByEmail } from '../utils/stripe.js';
import { isValidEmail } from '../utils/validation.js';
import { getDoc, requireOwnerAgentAdmin, validate } from './utils/index.js';

const reportErr = getReportErrorFn('addBillingEntity');

interface AddBillingEntityRequest {
  collection: Collection;
  docId: string;
  billingEntityDetails: {
    email: string;
    displayName: string;
    phone: string;
    // billingType: BillingType;
  };
}

const addBillingEntity = async ({ data, auth }: CallableRequest<AddBillingEntityRequest>) => {
  const { collection, docId, billingEntityDetails } = data;

  validate(collection, 'failed-precondition', 'collection required');
  validate(docId, 'failed-precondition', 'docId required');

  const db = getFirestore();
  const docRef = db.collection(collection).doc(docId) as DocumentReference<Quote>; // TODO: type assertion function - could be policy or quote
  const docData = await getDoc(docRef);

  // only callable by user, agent, orgAdmin, iDemandAdmin
  requireOwnerAgentAdmin(auth, docData);

  const email = billingEntityDetails?.email;
  validate(email && isValidEmail(email), 'failed-precondition', 'invalid email');

  let stripeCustomerId: string | undefined;
  const stripe = getStripe(stripeSecretKey.value());

  try {
    const cus = await getActiveStripeCustomerByEmail(stripe, email);
    stripeCustomerId = cus.id;
  } catch (err: any) {
    info(`active stripe customer not found ${billingEntityDetails.email}`);
  }

  // create a new stripe customer if active customer not found
  if (!stripeCustomerId) {
    try {
      const cus = await stripe.customers.create({
        email,
        name: billingEntityDetails.displayName || '',

        phone: billingEntityDetails.phone || '',
      });
      stripeCustomerId = cus.id;
    } catch (err: any) {
      reportErr('Error creating or retrieving Stripe customer', data, err);
      throw new HttpsError('internal', 'Error creating or retrieving Stripe customer');
    }
  }

  try {
    const updates: UpdateData<{ billingEntities: Record<string, BillingEntity> }> = {};
    updates[`billingEntities.${stripeCustomerId}`] = {
      email,
      phone: billingEntityDetails.phone || '',
      displayName: billingEntityDetails.displayName,
    };
    await docRef.update(updates);
    info(`Added stripe customer to doc billingEntities (cusID: ${stripeCustomerId})`, { ...data });
    return { stripeCustomerId };
  } catch (err: any) {
    reportErr('Failed to update document with stripe customer info', data, err);
    throw new HttpsError('internal', 'Failed to update document with stripe customer info');
  }
};

export default onCallWrapper<AddBillingEntityRequest>('addBillingEntity', addBillingEntity);
