import { Policy, Totals } from '@idemand/common';
import { Timestamp } from 'firebase-admin/firestore';
import { round, sumBy } from 'lodash-es';
import Stripe from 'stripe';
import { Payable } from '../../common/index.js';
import { verify } from '../../utils/index.js';
import { createTransferGroupId } from '../db/utils.js';

function toAmt(val: number) {
  return round(val * 100);
}

export const createPayableObject = async (
  stripe: Stripe,
  params: {
    cusId: string;
    policyId: string;
    totals: Totals;
    subProducerCommPct: number;
    billingEntityLocations: Policy['locations'];
    dueDate: Timestamp;
  }
): Promise<Payable> => {
  const { cusId, policyId, totals, subProducerCommPct, billingEntityLocations, dueDate } = params;
  const customer = await stripe.customers.retrieve(cusId);
  verify(!customer.deleted, `stripe customer deleted ${cusId}`);

  const lineItems = billingEntityTotalsToLineItems(totals, policyId);
  console.log('billing entity lineItems: ', lineItems);

  const transfers = getTransfersForNewPolicy(cusId, totals, subProducerCommPct);
  console.log('transfers: ', transfers);

  const payableAmounts = getPayableAmounts(totals);

  const payable: Payable = {
    policyId,
    stripeCustomerId: cusId,
    billingEntityDetails: {
      email: customer.email,
      name: customer.name || null,
      phone: customer.phone || null,
      address: customer.address || null,
    },
    lineItems,
    transfers,
    transferGroup: createTransferGroupId(policyId),
    taxes: totals.taxes,
    fees: totals.fees,
    status: 'outstanding',
    ...payableAmounts,
    paymentOption: null, // delete ?? create payment intent via invoice ?? derive state from invoiceId ??
    locations: billingEntityLocations, // getLcnSummariesByCusId(cusId, policyLocations),
    dueDate,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };

  return payable;
};

// TODO: replace totals by billing entity with line items ?? place total outside lineItems
// = { lineItems: [lineItem1, lineItem2], total: 1234 }
// TODO: match stripe line items ??
function billingEntityTotalsToLineItems(totals: Totals, policyId: string) {
  let lineItems = [
    {
      displayName: 'iDemand Flood term premium',
      amount: toAmt(totals.termPremium), //  * 100,
      descriptor: `Term premium for policy ${policyId}`, // `Term premium for locations assigned to ${customer.name || customer.email} under policy ${policyId}`
    },
  ];

  for (let fee of totals.fees) {
    lineItems.push({
      displayName: fee.displayName,
      amount: toAmt(fee.value),
      descriptor: '', // TODO: fee descriptor ??
    });
  }

  for (let tax of totals.taxes) {
    lineItems.push({
      displayName: tax.displayName,
      amount: toAmt(tax.value),
      descriptor: '', // TODO: add descriptor to tax object
    });
  }

  return lineItems;
}

// Requires DB call to get rating Doc ?? TODO: store as subcollection of policy
function getTransfersForNewPolicy(
  stripeAccountId: string,
  billingEntityTotals: Totals,
  subProducerCommissionPct: number
) {
  return [
    {
      amount: toAmt(billingEntityTotals.termPremium * subProducerCommissionPct),
      destination: stripeAccountId,
    },
  ];
}

function getPayableAmounts(totals: Totals) {
  const refundableTaxesAmount = toAmt(
    sumBy(
      totals.taxes.filter((t) => t.refundable || t.refundable === undefined),
      'value'
    )
  );
  const totalTaxesAmount = toAmt(sumBy(totals.taxes, 'value'));
  const totalFeesAmount = toAmt(sumBy(totals.taxes, 'value'));
  const refundableFeesAmount = toAmt(
    sumBy(
      // @ts-ignore
      totals.fees.filter((f) => f.refundable || f.refundable === undefined),
      'value'
    )
  );
  const termPremiumAmount = toAmt(totals.termPremium);
  const totalRefundableAmount =
    toAmt(totals.termPremium) + refundableFeesAmount + refundableTaxesAmount;
  const totalAmount = toAmt(totals.price);

  return {
    refundableFeesAmount,
    totalFeesAmount,
    refundableTaxesAmount,
    totalTaxesAmount,
    totalRefundableAmount,
    termPremiumAmount,
    totalAmount,
  };
}
