import { getFirestore } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { getReportErrorFn, transactionsCollection } from '../common';
import {
  constructTrxId,
  fetchPolicyData,
  fetchRatingData,
  formatPremiumTrx,
  trxExists,
} from '../utils/transactions';

// TODO: shared logic with new policy event (abstract into module)

const reportError = getReportErrorFn('policyRenewalListener');

export interface PolicyRenewalPayload {
  policyId: string;
}

export default async (event: CloudEvent<MessagePublishedData<PolicyRenewalPayload>>) => {
  info('POLICY RENEWAL EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  const eventId = event.id;
  let policyId = null;
  try {
    policyId = event.data?.message?.json?.policyId;
  } catch (e) {
    error('PubSub message was not JSON', e);
  }

  if (!policyId || typeof policyId !== 'string') {
    reportError(`Missing policy ID. Returning early.`, { policyId });
    return;
  }

  const db = getFirestore();
  // const policyCol = policiesCollection(db); // .withConverter(policyConverter)
  const trxCol = transactionsCollection(db);

  const policy = await fetchPolicyData(db, policyId);
  if (!policy) {
    reportError(`Policy not found. Returning early.`, { policyId });
    return;
  }

  const locationEntries = policy?.locations && Object.entries(policy.locations);
  if (!locationEntries || !locationEntries.length) {
    reportError('No policy locations found in policy', { policyId });
    return;
  }

  for (let [locationId, location] of locationEntries) {
    try {
      const trxId = constructTrxId(policyId, locationId, eventId);
      const trxRef = trxCol.doc(trxId);

      if (!trxExists(trxRef)) {
        const ratingData = await fetchRatingData(db, location.ratingDocId);

        const locationTrx = formatPremiumTrx('renewal', policy, location, ratingData, eventId);

        await trxRef.set({ ...locationTrx });
        info(`New transaction saved for location ${locationId}`, { locationTrx });
      }
    } catch (err: any) {
      // error(`Error creating transaction for location ${locationId} (Policy ID: ${policyId})`, {
      //   ...location,
      // });
      // reportErrorSentry(err, { func: 'policyRenewalListener', policyId, locationId });
      reportError(
        `Error creating transaction for location ${locationId} (Policy ID: ${policyId})`,
        { ...location, policyId },
        err
      );
    }
  }

  return;
};

// export function reportError(msg: string, ctx: Record<string, any> = {}, err: any = null) {
//   error(msg, { ...ctx, err });
//   reportErrorSentry(err || msg, { func: 'policyRenewalListener', msg, ...ctx });
// }
