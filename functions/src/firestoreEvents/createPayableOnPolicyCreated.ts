import {
  Organization,
  Policy,
  Totals,
  WithId,
  locationsCollection,
  orgsCollection,
} from '@idemand/common';
import { Firestore, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import { sumBy } from 'lodash-es';
import Stripe from 'stripe';
import { Payable, getReportErrorFn, payablesCollection, stripeSecretKey } from '../common/index.js';
import { createDocId, createTransferGroupId, getDocData } from '../modules/db/utils.js';
import { fetchRatingData } from '../modules/transactions/utils.js';
import { getStripe } from '../services/stripe.js';
import { verify } from '../utils/index.js';

// TODO: move to pub sub ?? or module so it can be reused for policy changes, renewal, etc.
// scenarios:
//    - create payable from new policy
//    - create payable from adding location
//    - create payable from removing location ?? or handle negative net balances differently ??
//      - one solution would be to create refunds for the removed locations, and turn on auto-charge customer's billing method

let subproducerCommissionPct: number | undefined;
async function getSubProducerCommPct(db: Firestore, policy: WithId<Policy>) {
  if (subproducerCommissionPct) return subproducerCommissionPct;
  const locationId = Object.keys(policy.locations)[0];
  if (!locationId) throw new Error('no locations');
  const locationData = await getDocData(locationsCollection(db).doc(locationId));
  const ratingDocId = locationData.ratingDocId;
  const ratingData = await fetchRatingData(db, ratingDocId);
  let subProdComm = ratingData.premiumCalcData.MGACommissionPct;
  if (typeof subProdComm !== 'number')
    throw new Error('rating doc missing subproducer commission pct');
  subproducerCommissionPct = subProdComm;
  return subProdComm;
}

const reportErr = getReportErrorFn('createPayableOnPolicyCreated');

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      policyId: string;
    }
  >
) => {
  const { policyId } = event.params;
  info(`policy created (${policyId}) - creating payables...`);
  try {
    const snap = event.data;
    verify(snap, 'no data associated with event');
    let p = event.data?.data() as Policy;
    verify(p, 'new policy missing data');
    const policy = { ...p, id: policyId };

    const db = getFirestore();
    const payablesCol = payablesCollection(db);

    const billingEntityIds = Object.keys(policy.billingEntities);

    const agencyId = policy.agency.orgId;
    const orgRef = orgsCollection(db).doc(agencyId);
    const org = await getDocData<Organization>(orgRef);
    const stripeAccountId = org.stripeAccountId;
    if (!stripeAccountId) throw new Error('missing stripe account Id');

    const batch = db.batch();

    for (let cusId of billingEntityIds) {
      const stripe = getStripe(stripeSecretKey.value());
      const customer = await stripe.customers.retrieve(cusId);
      console.log('stripe customer: ', customer);
      verify(!customer.deleted, `stripe customer deleted ${cusId}`);

      const lineItems = billingEntityTotalsToLineItems({ ...policy, id: policyId }, customer);
      console.log('billing entity lineItems: ', lineItems);

      const subProducerCommPct = await getSubProducerCommPct(db, policy);

      const totals = policy.totalsByBillingEntity[cusId];
      if (!totals) throw new Error(`missing totals for billing ID ${cusId}`);
      const transfers = getTransfersForNewPolicy(stripeAccountId, totals, subProducerCommPct);
      console.log('transfers: ', transfers);

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
      const totalRefundableAmount =
        totals.termPremium + refundableFeesAmount + refundableTaxesAmount;
      const totalAmount = totals.price * 100;

      let billingEntityLocations: Policy['locations'] = {};
      for (let [lcnId, lcn] of Object.entries(policy.locations)) {
        if (lcn.billingEntityId === cusId) billingEntityLocations[lcnId] = lcn;
      }

      let payable: Payable = {
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
        refundableFeesAmount,
        totalFeesAmount,
        refundableTaxesAmount,
        totalTaxesAmount,
        totalRefundableAmount,
        termPremiumAmount,
        totalAmount,
        paymentOption: null,
        locations: billingEntityLocations,
        metadata: {
          created: Timestamp.now(),
          updated: Timestamp.now(),
        },
      };

      let payableRef = payablesCol.doc(`rec_${createDocId(7)}`);
      batch.set(payableRef, payable);
    }

    await batch.commit();
  } catch (err: any) {
    let msg = 'Error creating payable for new policy';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
  }
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
      displayName: 'iDemand Flood term premium',
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
    },
  ];
}
