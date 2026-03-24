import { getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import {
  getReportErrorFn,
  receivablesCollection,
  stripeSecretKey,
  transfersCollection,
  type Receivable,
} from '../../common/index.js';
import { getQueryData } from '../../modules/db/utils.js';
import { getStripe } from '../../services/stripe.js';
import { verify } from '../../utils/validation.js';
import { extractPubSubPayload } from '../utils/extractPubSubPayload.js';
import {
  ChargeSucceededPayload,
  getReceivablesQueryFromCharge,
} from './createTaxTransactionsOnChargeSucceeded.js';

const reportErr = getReportErrorFn('createTransfersOnChargeComplete');

// CANNOT UPDATE PAYMENT INTENT TRANSFER_GROUP CREATED FROM INVOICE
/*
  "message": "Some of the parameters you provided (transfer_group) cannot be used when modifying a PaymentIntent that was created by an invoice. You can try again without those parameters."
*/
// must specify source_transaction = chargeId when making transfers b/c transfer_group cannot be set from invoice

export default async (
  event: CloudEvent<MessagePublishedData<ChargeSucceededPayload>>,
) => {
  info(
    'STRIPE CHARGE SUCCEEDED EVENT (create transfers listener) - MSG JSON: ',
    {
      ...(event.data?.message?.json || {}),
    },
  );

  const { charge } = extractPubSubPayload(event, ['charge']);

  try {
    verify(charge, 'pub sub event missing charge data');
  } catch (err: any) {
    reportErr(err?.message || '', { ...event }, err);
    return;
  }

  const stripe = getStripe(stripeSecretKey.value());
  const db = getFirestore();
  const receivablesCol = receivablesCollection(db);
  const transfersCol = transfersCollection(db);

  try {
    const q = getReceivablesQueryFromCharge(receivablesCol, charge);
    const receivable = (await getQueryData(q, true))[0];

    const transfers = receivable.transfers;
    // TODO: zod validation ?? (when creating receivable)
    if (!Array.isArray(transfers) || !transfers.length) {
      info(
        `No transfers found on receivable ${receivable.id}. returning early.`,
      );
      return;
    }

    // use batch ?? or save directly after the transfer is created ??
    // TODO: don't use batch (more likely to get out of sync or want all transfers to fail if one fails) ??
    const batch = db.batch();

    const updatedTransfers: Receivable['transfers'] = [];

    for (const t of transfers) {
      // TODO: check if transfer already made ?? or set at receivable level ??
      // or set amountTransferred in case of partial payments ??
      // TODO: add transferPct and refundableTransferPct to transfer item
      // should actual calc take into account non-refundable items ??
      const transferPct = t.amount / receivable.totalAmount;
      const transferAmount = transferPct * charge.amount_captured;
      const transfer = await stripe.transfers.create({
        amount: transferAmount, // t.amount,
        currency: 'usd',
        source_transaction: charge.id, // prevent transfer before funds available
        destination: t.destination,
      });
      // TODO: update receivable transfer with transfer ID for idempotency (check before creating transfer)
      // or will it fail from setting source_transaction ?? (ex: not if 15% is transferred < 8 times)

      const transferRef = transfersCol.doc(transfer.id);
      batch.set(transferRef, transfer);

      updatedTransfers.push({
        ...t,
        transferIds: [...(t.transferIds || []), transfer.id],
      });
    }

    batch.update(receivablesCol.doc(receivable.id), {
      transfers: updatedTransfers,
    });

    await batch.commit();
  } catch (err: any) {
    const msg = 'error creating transfers on charge.succeeded';

    reportErr(msg, {}, err);
  }

  return;
};
