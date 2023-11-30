import { info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import Stripe from 'stripe';
import { getReportErrorFn } from '../../common/index.js';
import { createTaxTrxReversal } from '../../modules/taxes/createTaxReversalTrx.js';
import { verify } from '../../utils/validation.js';

// need to update stripe refund metadata to include tax refund amounts ??

const reportErr = getReportErrorFn('reverseTaxTransactionsOnRefund');

interface ReverseTaxTrxOnRefundPayload {
  refund: Stripe.Refund;
}

export default async (event: CloudEvent<MessagePublishedData<ReverseTaxTrxOnRefundPayload>>) => {
  info('STRIPE REFUND EVENT (reverse tax transactions listener) - MSG JSON: ', {
    ...(event.data?.message?.json || {}),
  });

  let refund: Stripe.Refund | null = null;

  try {
    refund = event.data?.message?.json?.refund;
  } catch (e) {
    reportErr('PubSub message was not JSON', {}, e);
  }

  // const db = getFirestore();
  // const taxTrxCol = taxTransactionsCollection(db);

  try {
    verify(refund, 'pub sub payload missing refund object');
    info('refund.created data [create tax transactions]: ', refund);

    const commitRes = await createTaxTrxReversal(refund);

    // if (!refund.charge) throw new Error('refund missing charge ID');
    // const q = taxTrxCol
    //   .where('chargeId', '==', refund.charge)
    //   .where('type', '==', TaxTransactionType.Enum.transaction) as Query<TaxOgTransaction>;
    // const taxTrxs = await getQueryData<TaxOgTransaction>(q, false);
    // info(`found ${taxTrxs.length} tax transactions matching charge ${refund.charge}`, { taxTrxs });
    // if (!taxTrxs.length) return;

    // // remove undefined check once all taxes have been updated ??
    // // @ts-ignore
    // const refundableTrxs = taxTrxs.filter((t) => t.refundable === undefined || t.refundable);
    // const trxObjectPromises = refundableTrxs.map((taxTrx) =>
    //   createTaxReversalTrxObject(taxTrx, refund as Stripe.Refund)
    // );
    // const taxTrxReversalObjects = await Promise.all(trxObjectPromises);

    // const batch = db.batch();

    // for (let taxReversalTrx of taxTrxReversalObjects) {
    //   let taxReversalTrxRef = taxTrxCol.doc(createReversalId());
    //   batch.set(taxReversalTrxRef, taxReversalTrx);
    // }

    // const commitRes = await batch.commit();
    info(`tax reversal transactions successfully created (${commitRes.length} records)`);
  } catch (err: any) {
    let msg = 'error creating transfers on charge.succeeded';

    reportErr(msg, { ...event }, err);
  }

  return;
};
