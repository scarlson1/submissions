// https://stripe.com/docs/api/tax/transactions/create_from_calculation

import { TaxCalc, TaxOgTransaction, taxCalcCollection } from '@idemand/common';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import Stripe from 'stripe';
import { getDocData } from '../db';

// TODO: determine best place for tax amount calc
function taxCalcToTaxTrx(
  taxCalc: TaxCalc,
  charge: Stripe.Charge,
  policyId: string
): TaxOgTransaction {
  const percentCaptured = charge.amount_captured / charge.amount;
  const taxAmount = percentCaptured * taxCalc.value;

  return {
    type: 'transaction',
    chargeAmount: charge.amount_captured,
    taxAmount,
    taxId: taxCalc.taxId,
    taxCalcId: taxCalc.taxCalcId,
    taxDate: Timestamp.now(),
    // @ts-ignore
    policyId: policyId || null,
    stripeCustomerId: charge.customer as string,
    customerDetails: null, // TODO
    invoiceId: charge.invoice as string | null,
    paymentIntentId: charge.payment_intent as string | null,
    chargeId: charge.id,
    reversal: null,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
}

export const createTaxTrxObjectFromCalc = async (
  taxCalcId: string,
  charge: Stripe.Charge,
  policyId: string
) => {
  const db = getFirestore(); // able to call this from outside cloud fn ??
  const taxCalcRef = taxCalcCollection(db).doc(taxCalcId);
  const taxCalc = await getDocData<TaxCalc>(taxCalcRef);

  return taxCalcToTaxTrx(taxCalc, charge, policyId);
};
