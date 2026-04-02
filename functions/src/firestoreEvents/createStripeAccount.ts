import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { FirestoreEvent } from 'firebase-functions/v2/firestore';
import { getReportErrorFn, stripeSecretKey } from '../common/index.js';
import { createStripeConnectAccount, verify } from '../utils/index.js';

// docs: https://stripe.com/docs/api/accounts/create
// merchant codes: https://stripe.com/docs/connect/setting-mcc

const reportErr = getReportErrorFn('createStripeAccount');

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      orgId: string;
    }
  >,
) => {
  const { orgId } = event.params;
  try {
    const snap = event.data;
    verify(snap, 'no data associated with event');

    // create stripe connect account, if doesn't exist & update to org doc
    const account = await createStripeConnectAccount(
      stripeSecretKey.value(),
      orgId,
    );

    info(`Org stripe account ID set in DB ${account.id}`);
    return;
  } catch (err: unknown) {
    let msg = 'Error creating stripe account ID';
    if (err instanceof Error) msg += ` (${err.message})`;
    reportErr(msg, { ...event }, err);
    return;
  }
};
