import { Organization } from '@idemand/common';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getReportErrorFn, stripeSecretKey } from '../common/index.js';
import { getStripe } from '../services/stripe.js';
import { verify } from '../utils/index.js';

// docs: https://stripe.com/docs/api/accounts/create

const reportErr = getReportErrorFn('createStripeAccount');

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      orgId: string;
    }
  >
) => {
  const { orgId } = event.params;
  try {
    const snap = event.data;
    verify(snap, 'no data associated with event');
    const org = event.data?.data() as Organization;
    verify(org, 'new org missing data');

    const { stripeAccountId } = org;

    if (stripeAccountId) {
      info(`Org ${orgId} already has stripe account ID. Returning early.`);
      return;
    }

    const stripe = getStripe(stripeSecretKey.value());

    // create stripe account ID
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
        mcc: 'insurance_underwriting_premiums', // 6300, // Insurance Underwriting, Premiums
        // mcc: 6399, // insurance_default // Insurance - Default
        // url: ''
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
        // url: 'https://idemandinsurance.com',
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

    info(`stripe account created for org ${orgId}`, { account });
    // update db doc
    await snap.ref.update({
      stripeAccountId: account.id,
    });
    info(`Org stripe account ID set in DB`);
    return;
  } catch (err: any) {
    let msg = 'Error creating stripe account ID';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
    return;
  }
};
