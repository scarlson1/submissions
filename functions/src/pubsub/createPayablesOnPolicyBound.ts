import { Policy, Totals, WithId } from '@idemand/common';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import { sumBy } from 'lodash-es';
import Stripe from 'stripe';
import {
  Receivable,
  getReportErrorFn,
  policiesCollection,
  receivablesCollection,
  stripeSecretKey,
} from '../common/index.js';
import { createDocId, getDocData } from '../modules/db/index.js';
import { getInvoiceDueDateTS } from '../modules/payments/utils.js';
import { getComm } from '../modules/rating/utils.js';
import { getStripe } from '../services/index.js';
import { verify } from '../utils/index.js';
import { PolicyCreatedPayload } from './policyCreatedListener.js';
import { extractPubSubPayload } from './utils/extractPubSubPayload.js';

// NOT BEING USED - CURRENTLY RUNNING FROM POLICY CREATED EVENT
// ^^ would create receivable from policy csv import -- intended behavior ??

// TODO: validate policy before binding
// billing entity has email --> look up to make sure exists in stripe
// make sure agency has stripe account ID --> verify exists in stripe

// TODO: what params should be passed to allow for creating receivables in different scenarios ??
// add locations ?? renewal ??

const reportErr = getReportErrorFn('createReceivablesOnPolicyBound');

export default async (event: CloudEvent<MessagePublishedData<PolicyCreatedPayload>>) => {
  // let policyId = null;

  // try {
  //   policyId = event.data?.message?.json?.policyId;
  // } catch (e) {
  //   reportErr('PubSub message was not JSON', {}, e);
  // }
  const { policyId } = extractPubSubPayload(event, ['policyId']);

  const db = getFirestore();
  const policyCol = policiesCollection(db);
  const receivablesCol = receivablesCollection(db);

  try {
    verify(policyId, 'pub sub payload missing policyId');
    const policy = await getDocData<Policy>(
      policyCol.doc(policyId),
      `policy not found (${policyId})`
    );

    const billingEntityIds = Object.keys(policy.billingEntities);
    const stripeAccountId = policy.agency.stripeAccountId;
    verify(stripeAccountId, 'agency missing stripe account ID');

    const { subproducerCommissionPct } = await getComm(
      policy.commSource,
      policy.agency.orgId,
      policy.agent.userId,
      policy.product
    );

    const stripe = getStripe(stripeSecretKey.value());
    const batch = db.batch();

    // for each billing entity
    for (let cusId of billingEntityIds) {
      const customer = await stripe.customers.retrieve(cusId);
      verify(!customer.deleted, `stripe customer deleted ${cusId}`);

      const lineItems = billingEntityTotalsToLineItems({ ...policy, id: policyId }, customer);
      console.log('billing entity lineItems: ', lineItems);

      const totals = policy.totalsByBillingEntity[cusId];
      verify(totals, `missing totals for billing ID ${cusId}`);
      const transfers = getTransfersForNewPolicy(stripeAccountId, totals, subproducerCommissionPct);
      info(`transfers: `, transfers);

      const receivableAmounts = getReceivableAmounts(totals);

      let billingEntityLocations: Policy['locations'] = {};
      for (let [lcnId, lcn] of Object.entries(policy.locations)) {
        if (lcn.billingEntityId === cusId) billingEntityLocations[lcnId] = lcn;
      }

      let receivable: Receivable = {
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
        taxes: totals.taxes,
        fees: totals.fees,
        status: 'outstanding',
        paid: false,
        paidOutOfBand: false,
        ...receivableAmounts,
        locations: billingEntityLocations,
        dueDate: getInvoiceDueDateTS(
          policy?.metadata?.created || Timestamp.now(),
          policy.effectiveDate
        ),
        metadata: {
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      };

      let receivableRef = receivablesCol.doc(`rec_${createDocId(7)}`);
      batch.set(receivableRef, receivable);
    }
  } catch (err: any) {
    let msg = 'Error creating receivables for new bound policy';

    reportErr(msg, { ...event }, err);
  }
  return;
};

// TODO: replace totals by billing entity with line items ?? place total outside lineItems
// = { lineItems: [lineItem1, lineItem2], total: 1234 }
function billingEntityTotalsToLineItems(policy: WithId<Policy>, customer: Stripe.Customer) {
  const billingEntityTotals = policy.totalsByBillingEntity[customer.id];
  // TODO: enable zod validation
  // if (!TotalsByBillingEntity.safeParse(billingEntityTotals)) throw new Error(`missing billing entity totals for ${billingEntityId}`)
  if (!billingEntityTotals) throw new Error(`missing billing entity totals for ${customer.id}`);

  let lineItems = [
    {
      displayName: 'iDemand Flood Insurance term premium',
      amount: billingEntityTotals.termPremium * 100,
      descriptor: `Total term premium for locations assigned to ${
        customer.name || customer.email
      } under policy ${policy.id}`,
    },
  ];

  for (let fee of billingEntityTotals.fees) {
    lineItems.push({
      displayName: fee.displayName,
      amount: fee.value * 100,
      descriptor: '',
    });
  }

  for (let tax of billingEntityTotals.taxes) {
    lineItems.push({
      displayName: tax.displayName,
      amount: tax.value * 100,
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
      amount: billingEntityTotals.termPremium * subProducerCommissionPct,
      destination: stripeAccountId,
      percentOfTermPremium: subProducerCommissionPct,
    },
  ];
}

function getReceivableAmounts(totals: Totals) {
  const refundableTaxesAmount =
    sumBy(
      totals.taxes.filter((t) => t.refundable || t.refundable === undefined),
      'value'
    ) * 100;
  const totalTaxesAmount = sumBy(totals.taxes, 'value') * 100;
  const totalFeesAmount = sumBy(totals.taxes, 'value') * 100;
  const refundableFeesAmount =
    sumBy(
      // @ts-ignore
      totals.fees.filter((f) => f.refundable || f.refundable === undefined),
      'value'
    ) * 100;
  const termPremiumAmount = totals.termPremium;
  const totalRefundableAmount = totals.termPremium + refundableFeesAmount + refundableTaxesAmount;
  const totalAmount = totals.price * 100;

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
