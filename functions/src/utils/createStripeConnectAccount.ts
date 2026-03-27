import { Organization, orgsCollection } from '@idemand/common';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { getDocData } from '../modules/db/index.js';
import { getStripe } from '../services/index.js';

export const createStripeConnectAccount = async (stripeSecret: string, orgId: string) => {
  const db = getFirestore();
  const orgRef = orgsCollection(db).doc(orgId);
  const org = await getDocData<Organization>(orgRef);

  const stripe = getStripe(stripeSecret);

  // allow override ?? pass override option as prop ?? allow override if not already active / set up ??
  if (org.stripeAccountId) {
    const existingAccount = await stripe.accounts.retrieve(org.stripeAccountId);
    if (existingAccount) throw new Error('Org stripe account already exists');
  }

  const account = await stripe.accounts.create({
    type: 'custom',
    country: 'US',
    // email: '', // use contact if available ??
    business_type: 'company',
    capabilities: {
      card_payments: { requested: true },
      us_bank_account_ach_payments: { requested: true },
      link_payments: { requested: true },
      transfers: { requested: true },
    },
    business_profile: {
      name: org.orgName || '',
      mcc: '6300', // 'insurance_underwriting_premiums', // 6300,
      // mcc: 6399, // insurance_default // Insurance - Default
      // url: org.website || ''
    },
    company: {
      name: org.orgName,
      address: {
        line1: org?.address?.addressLine1 || '',
        line2: org?.address?.addressLine2 || '',
        city: org?.address?.city || '',
        state: org?.address?.state || '',
        postal_code: org?.address?.postal || '',
        country: 'US',
      },
      tax_id: org.FEIN || '',
      // url: org.website || ''
    },
    settings: {
      payouts: {
        schedule: {
          interval: 'monthly',
          monthly_anchor: 1, // 1-31
        },
        debit_negative_balances: true,
        // statement_descriptor: 'iDemand Insurance monthly commission',
      },
    },
  });
  info(`Stripe connect account created ${account.id} for org ${org.orgName || org.id}`);

  await orgRef.update({
    stripeAccountId: account.id,
    'metadata.updated': Timestamp.now(),
  });

  return account;
};
