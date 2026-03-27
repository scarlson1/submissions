import { Policy, Totals } from '@idemand/common';
import { Timestamp } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { round, sumBy } from 'lodash-es';
import Stripe from 'stripe';
import { Receivable } from '../../common/index.js';
import { verify } from '../../utils/index.js';

function toAmt(val: number) {
  return round(val * 100);
}

export const createReceivableObject = async (
  stripe: Stripe,
  params: {
    cusId: string;
    policyId: string;
    totals: Totals;
    subProducerCommPct: number;
    billingEntityLocations: Policy['locations'];
    dueDate: Timestamp;
  },
): Promise<Receivable> => {
  const {
    cusId,
    policyId,
    totals,
    subProducerCommPct,
    billingEntityLocations,
    dueDate,
  } = params;
  const customer = await stripe.customers.retrieve(cusId);
  verify(!customer.deleted, `stripe customer deleted ${cusId}`);

  const lineItems = billingEntityTotalsToLineItems(totals, policyId);
  // console.log('billing entity lineItems: ', lineItems);

  const transfers = getTransfersForNewPolicy(cusId, totals, subProducerCommPct);
  // console.log('transfers: ', transfers);

  const receivableAmounts = getReceivableAmounts(totals);

  const receivable: Receivable = {
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
    // transferGroup: createTransferGroupId(policyId),// TODO: don't create - cannot set on payment intent created by invoice --> need to set once payment intent is created
    taxes: totals.taxes,
    fees: totals.fees,
    status: 'outstanding',
    paid: false,
    paidOutOfBand: false,
    ...receivableAmounts,
    locations: billingEntityLocations, // getLcnSummariesByCusId(cusId, policyLocations),
    dueDate,
    totalTransferred: 0,
    totalAmountPaid: 0,
    transfersByCharge: {},
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };

  info(`Receivable object created for policy ${policyId}`, receivable);
  return receivable;
};

// TODO: replace totals by billing entity with line items ?? place total outside lineItems
// = { lineItems: [lineItem1, lineItem2], total: 1234 }
// TODO: match stripe line items ??
function billingEntityTotalsToLineItems(totals: Totals, policyId: string) {
  const lineItems = [
    {
      displayName: 'iDemand Flood term premium',
      amount: toAmt(totals.termPremium), //  * 100,
      descriptor: `Term premium for policy ${policyId}`, // `Term premium for locations assigned to ${customer.name || customer.email} under policy ${policyId}`
    },
  ];

  for (const fee of totals.fees) {
    lineItems.push({
      displayName: fee.displayName,
      amount: toAmt(fee.value),
      descriptor: '', // TODO: fee descriptor ??
    });
  }

  for (const tax of totals.taxes) {
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
  subProducerCommissionPct: number,
) {
  return [
    {
      amount: toAmt(billingEntityTotals.termPremium * subProducerCommissionPct),
      destination: stripeAccountId,
      percentOfTermPremium: subProducerCommissionPct,
    },
  ];
}

function getReceivableAmounts(totals: Totals) {
  const refundableTaxesAmount = toAmt(
    sumBy(
      totals.taxes.filter((t) => t.refundable || t.refundable === undefined),
      'value',
    ),
  );
  const totalTaxesAmount = toAmt(sumBy(totals.taxes, 'value'));
  const totalFeesAmount = toAmt(sumBy(totals.fees, 'value'));
  const refundableFeesAmount = toAmt(
    sumBy(
      // @ts-ignore
      totals.fees.filter((f) => f.refundable || f.refundable === undefined),
      'value',
    ),
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
