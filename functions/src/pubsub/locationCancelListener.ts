import { isValid } from 'date-fns';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { info, warn } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import {
  CancellationReason,
  OffsetTransaction,
  PremiumTransaction,
  WithId,
  getReportErrorFn,
  transactionsCollection,
} from '../common';
import {
  constructTrxId,
  docExists,
  fetchPolicyData,
  fetchPreviousTrx,
  getOffsetTrx,
} from '../modules/transactions';
import { premEndorsementPrevTypes } from './endorsementListener';

const reportErr = getReportErrorFn('locationCancelListener');

export interface LocationCancelPayload {
  policyId: string;
  locationId: string;
  cancelReason: CancellationReason;
  cancelEffDateMS: number;
}

export default async (event: CloudEvent<MessagePublishedData<LocationCancelPayload>>) => {
  info('LOCATION CANCEL EVENT - MSG JSON: ', { ...(event.data?.message?.json || {}) });

  const eventId = event.id;
  let policyId = null;
  let locationId = null;
  let cancelReason = null;
  let cancelEffDateMS = null;

  try {
    policyId = event.data?.message?.json?.policyId;
    locationId = event.data?.message?.json?.locationId;
    cancelReason = event.data?.message?.json?.cancelReason || null;
    cancelEffDateMS = event.data?.message?.json?.cancelEffDateMS || null;
  } catch (e) {
    reportErr('PubSub message was not JSON', {}, e);
  }

  if (
    !policyId ||
    !locationId ||
    typeof policyId !== 'string' ||
    typeof locationId !== 'string' ||
    !cancelEffDateMS ||
    !isValid(cancelEffDateMS)
  ) {
    reportErr(`Missing policy and/or location ID and/or cancel effective date`, {
      policyId,
      locationId,
    });
    return;
  }

  const db = getFirestore();
  const trxCol = transactionsCollection(db);

  const policy = await fetchPolicyData(db, policyId);
  if (!policy) {
    reportErr(`Policy not found. Returning early.`, { policyId, locationId });
    return;
  }

  let prevTrx;
  try {
    prevTrx = await fetchPreviousTrx(db, policyId, locationId, premEndorsementPrevTypes);
  } catch (err: any) {
    reportErr(
      `No previous transactions found matching query. returning early`,
      { policyId, locationId },
      err
    );
    return;
  }

  try {
    const trxId = constructTrxId(policyId, locationId, eventId);
    const trxRef = trxCol.doc(trxId);

    const exists = await docExists(trxRef);
    if (!exists) {
      const trxEffDate = Timestamp.fromMillis(cancelEffDateMS);

      const offsetTrx = getOffsetTrx(
        policy,
        prevTrx as WithId<PremiumTransaction | OffsetTransaction>,
        trxEffDate,
        eventId,
        'cancellation',
        cancelReason
      );

      await trxRef.set({ ...offsetTrx });
    } else {
      warn(`Ignoring event. Transaction already processed ${trxId}`);
    }
  } catch (err: any) {
    reportErr(`Error saving cancel transaction`, { policyId, locationId }, err);
  }
};
