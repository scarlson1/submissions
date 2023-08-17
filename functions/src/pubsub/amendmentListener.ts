import { getFirestore } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info, warn } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { transactionsCollection } from '../common';
import {
  constructTrxId,
  docExists,
  fetchPolicyData,
  getLocationAmendmentTrx,
  getPolicyAmendmentTrx,
} from '../modules/transactions';
import { reportErrorSentry } from '../services/sentry';

// Trx. eff date (policy amendment): determined by insured (form submission --> pubsub payload)
// Trx. eff date (location amendment): no clue? insured ?? can mortgagee be backdated by insured ??

export interface AmendmentPayload {
  policyId: string;
  locationId: string | null;
  amendmentScope: 'policy' | 'location';
  effDateMS: number;
}

export default async (event: CloudEvent<MessagePublishedData<AmendmentPayload>>) => {
  info('AMENDMENT EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  const eventId = event.id;
  let policyId = null;
  let locationId = null;
  let amendmentScope = null;

  try {
    policyId = event.data?.message?.json?.policyId;
    locationId = event.data?.message?.json?.locationId;
    amendmentScope = event.data?.message?.json?.amendmentScope;
  } catch (err: any) {
    reportError('PubSub message was not JSON', {}, err);
  }

  const locationRequired = amendmentScope === 'location';
  const locationVerified = locationRequired
    ? Boolean(locationId) && typeof locationId === 'string'
    : true;
  if (!policyId || typeof policyId !== 'string' || !locationVerified) {
    reportError(`Missing policy and/or location ID`, {
      policyId,
      locationId: locationId ?? 'not provided',
    });
    return;
  }

  const db = getFirestore();
  const trxCol = transactionsCollection(db);

  const policy = await fetchPolicyData(db, policyId);
  if (!policy) {
    reportError(`Policy not found. Returning early.`, { policyId });
    return;
  }

  try {
    const trxId = constructTrxId(policyId, locationId || '', eventId);
    const trxRef = trxCol.doc(trxId);

    const exists = await docExists(trxRef);
    if (!exists) {
      let trx;
      if (locationRequired && locationId) {
        const location = policy.locations[locationId];

        trx = getLocationAmendmentTrx(policy, location, eventId);
      } else {
        trx = getPolicyAmendmentTrx(policy, eventId);
      }

      await trxRef.set({ ...trx });
    } else {
      warn(`Ignoring event. Transaction already processed ${trxId}`);
    }
  } catch (err: any) {
    reportError(`Error saving transaction to database (policyId: ${policyId})`, { policyId }, err);
  }

  return;
};

export function reportError(msg: string, ctx: Record<string, any> = {}, err: any = null) {
  error(msg, { ...ctx, err });
  reportErrorSentry(err || msg, { func: 'amendmentListener', msg, ...ctx });
}
