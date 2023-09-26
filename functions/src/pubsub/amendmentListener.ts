import { getFirestore } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { error, info, warn } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import { locationsCollection, transactionsCollection } from '../common/index.js';
import { verify } from '../utils/index.js';
import {
  constructTrxId,
  docExists,
  fetchPolicyData,
  getLocationAmendmentTrx,
  getPolicyAmendmentTrx,
} from '../modules/transactions/index.js';
import { reportErrorSentry } from '../services/sentry/index.js';

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
    reportErr('PubSub message was not JSON', {}, err);
  }

  const locationRequired = amendmentScope === 'location';
  try {
    const locationVerified = locationRequired
      ? Boolean(locationId) && typeof locationId === 'string'
      : true;

    verify(policyId && typeof policyId === 'string', 'missing policyId');
    verify(locationVerified, 'missing locationId');
  } catch (err: any) {
    let msg = err?.message || 'invalid event.params';
    reportErr(msg, { policyId }, err);
    return;
  }

  const db = getFirestore();
  const locationsCol = locationsCollection(db);
  const trxCol = transactionsCollection(db);
  let policy;

  try {
    const policyRes = await fetchPolicyData(db, policyId);
    verify(policyRes, 'error fetching policy. returning early.');
    policy = policyRes;
  } catch (err: any) {
    let msg = err?.message || 'error fetching docs';
    reportErr(msg, { policyId }, err);
    return;
  }

  try {
    const trxId = constructTrxId(policyId, locationId || '', eventId);
    const trxRef = trxCol.doc(trxId);

    const exists = await docExists(trxRef);
    if (!exists) {
      let trx;
      if (locationRequired && locationId) {
        const locationSnap = await locationsCol.doc(locationId).get();
        const location = locationSnap.data();
        verify(location, `location doc not found (ID: ${locationId})`);
        // const location = policy.locations[locationId];

        trx = getLocationAmendmentTrx(policy, location, eventId);
      } else {
        trx = getPolicyAmendmentTrx(policy, eventId);
      }

      await trxRef.set({ ...trx });
    } else {
      warn(`Ignoring event. Transaction already processed ${trxId}`);
    }
  } catch (err: any) {
    reportErr(`Error saving transaction to database (policyId: ${policyId})`, { policyId }, err);
  }

  return;
};

export function reportErr(msg: string, ctx: Record<string, any> = {}, err: any = null) {
  error(msg, { ...ctx, err });
  reportErrorSentry(err || msg, { func: 'amendmentListener', msg, ...ctx });
}
