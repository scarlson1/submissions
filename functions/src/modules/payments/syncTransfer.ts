import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import Stripe from 'stripe';
import { getReportErrorFn, transfersCollection } from '../../common/index.js';
import { verify } from '../../utils/validation.js';

type TransferEventType = 'transfer.reversed' | 'transfer.created' | 'transfer.updated';

const reportErr = getReportErrorFn('syncTransfer');

export const syncTransfer = async (transfer: Stripe.Transfer, type: TransferEventType) => {
  try {
    verify(transfer?.id, 'transfer missing ID');
    const db = getFirestore();
    const transferRef = transfersCollection(db).doc(transfer.id);
    info(`syncing stripe transfer to DB [event: ${type}]`, transfer);

    await transferRef.set(
      {
        ...transfer,
        metadata: {
          ...transfer.metadata,
          created: Timestamp.fromMillis(transfer.created * 1000), // created stored as seconds ??
          updated: Timestamp.now(),
        },
      },
      { merge: true }
    );
    info(`transfer successfully saved to DB`);
  } catch (err: any) {
    let msg = `Error syncing transfer to DB`;
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, { ...transfer }, err);
    // throw if err is db connection error ??
  }
};
