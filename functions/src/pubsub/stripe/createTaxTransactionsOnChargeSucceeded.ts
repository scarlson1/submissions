import { taxTransactionsCollection } from '@idemand/common';
import { CollectionReference, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import Stripe from 'stripe';
import { Payable, getReportErrorFn, payablesCollection } from '../../common/index.js';
import { createTaxTrxId, getQueryData } from '../../modules/db/utils.js';
import { createTaxTrxObjectFromCalc } from '../../modules/taxes/createTaxTrxObjectFromCalc.js';
import { verify } from '../../utils/validation.js';
import { extractPubSubPayload } from '../utils/extractPubSubPayload.js';

const reportErr = getReportErrorFn('createTransfersOnChargeComplete');

export interface ChargeSucceededPayload {
  charge: Stripe.Charge;
  // TODO: include other stripe event data ??
}

export default async (event: CloudEvent<MessagePublishedData<ChargeSucceededPayload>>) => {
  info('STRIPE CHARGE SUCCEEDED EVENT (create transfers listener) - MSG JSON: ', {
    ...(event.data?.message?.json || {}),
  });

  const { charge } = extractPubSubPayload(event, ['charge']);

  const db = getFirestore();
  const payablesCol = payablesCollection(db);
  const taxTrxCol = taxTransactionsCollection(db);

  try {
    verify(charge, 'pub sub payload missing charge object');
    info('charge.succeeded data [create tax transactions]: ', charge);

    // TODO: move to function createTaxTransactionsFromCalc(payableId, charge) ?? similar to reversals
    // easier to test ^^

    // fetch payable by transferGroup, or paymentIntent, or invoice
    let q = getPayablesQueryFromCharge(payablesCol, charge);
    const payable = (await getQueryData(q, true))[0];
    const taxes = payable.taxes;
    info(`Creating tax transactions from payable (${taxes.length} taxes)...`, { ...payable });
    if (!taxes.length) return;

    // fetched tax calc, returns tax transaction for each tax in payable
    const trxObjectPromises = taxes.map((tax) =>
      createTaxTrxObjectFromCalc(
        tax.taxCalcId,
        charge as Stripe.Charge,
        payable.policyId,
        payable.id
      )
    );
    const taxTrxObjects = await Promise.all(trxObjectPromises);

    const batch = db.batch();

    for (let taxTrx of taxTrxObjects) {
      let taxTrxRef = taxTrxCol.doc(createTaxTrxId());
      batch.set(taxTrxRef, taxTrx);
    }

    const commitRes = await batch.commit();
    info(`tax transactions successfully created (${commitRes.length} records)`);
  } catch (err: any) {
    let msg = 'error creating transfers on charge.succeeded';

    reportErr(msg, {}, err);
  }

  return;
};

export function getPayablesQueryFromCharge(
  payablesCol: CollectionReference<Payable>,
  charge: Stripe.Charge
) {
  const invoice = charge?.invoice;
  const paymentIntent = charge?.payment_intent;
  // const transferGroup = charge?.transfer_group;

  let q = payablesCol;
  // TRANSFER GROUP ONLY BEING SET FROM INTENT CREATED EVENT (NOT RELIABLE)
  // if (transferGroup) {
  //   q.where('transferGroup', '==', transferGroup);
  // } else
  if (invoice) {
    q.where('invoiceId', '==', invoice);
  } else if (paymentIntent) {
    q.where('paymentIntentId', '==', paymentIntent);
  } else {
    throw new Error(
      'Unable to determine query to fetch payable for successful charge. Failed to determine/create tax transactions'
    );
  }

  return q.limit(1);
}
