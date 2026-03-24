import {
  TaxOgTransaction,
  TaxReversalTransaction,
  taxTransactionsCollection,
  TaxTransactionType,
  WithId,
} from '@idemand/common';
import { getFirestore, Query, Timestamp } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { round } from 'lodash-es';
import Stripe from 'stripe';
import { createReversalId, getQueryData } from '../db/index.js';

// https://stripe.com/docs/api/tax/transactions/create_reversal
// https://stripe.com/docs/api/tax/transactions/create_from_calculation

/*
Creates transaction firestore doc for any taxes that need to be reversed from stripe refund event
*/

// TODO: determine best place for tax amount calc
function createTaxTrxReversalObject(
  originalTrx: WithId<TaxOgTransaction>,
  refund: Stripe.Refund,
): TaxReversalTransaction {
  const percentRefunded = refund.amount / originalTrx.chargeAmount;
  const reversalAmount = round(percentRefunded * originalTrx.taxAmount);

  return {
    ...originalTrx,
    type: 'reversal',
    reversal: {
      originalTransactionId: originalTrx.id,
    },
    chargeAmount: -Math.abs(refund.amount), // amount refunded
    taxAmount: -Math.abs(reversalAmount), // tax refunded
    refundId: refund.id,
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };
}

export const createTaxTrxReversal = async (refund: Stripe.Refund) => {
  const db = getFirestore();
  const taxTrxCol = taxTransactionsCollection(db);

  if (!refund?.charge) throw new Error('refund missing charge ID');

  const q = taxTrxCol
    .where('chargeId', '==', refund.charge)
    .where(
      'type',
      '==',
      TaxTransactionType.Enum.transaction,
    ) as Query<TaxOgTransaction>;

  const taxTrxs = await getQueryData<TaxOgTransaction>(q, false);
  info(
    `found ${taxTrxs.length} tax transactions matching charge ${refund.charge}`,
    { taxTrxs },
  );

  if (!taxTrxs.length) return [];

  // remove undefined check once all taxes have been updated ??
  const refundableTrxs = taxTrxs.filter(
    (t) => t.refundable === undefined || t.refundable,
  );
  const trxObjectPromises = refundableTrxs.map((taxTrx) =>
    createTaxTrxReversalObject(taxTrx, refund as Stripe.Refund),
  );
  const taxTrxReversalObjects = await Promise.all(trxObjectPromises);

  const batch = db.batch();

  for (const taxReversalTrx of taxTrxReversalObjects) {
    const taxReversalTrxRef = taxTrxCol.doc(createReversalId());
    batch.set(taxReversalTrxRef, taxReversalTrx);
  }

  return batch.commit();
};
