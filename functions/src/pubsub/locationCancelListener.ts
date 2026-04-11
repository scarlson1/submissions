import { isValid } from 'date-fns';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { CloudEvent } from 'firebase-functions/lib/v2/core';
import { info, warn } from 'firebase-functions/logger';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';

import type { WithId } from '@idemand/common';
import {
  CancellationReason,
  getReportErrorFn,
  OffsetTransaction,
  PremiumTransaction,
  transactionsCollection,
} from '../common/index.js';
import { docExists } from '../modules/db/index.js';
import {
  constructTrxId,
  fetchPolicyData,
  fetchPreviousTrx,
  getOffsetTrx,
} from '../modules/transactions/index.js';
import { verify } from '../utils/index.js';
import { premEndorsementPrevTypes } from './endorsementListener.js';
import { extractPubSubPayload } from './utils/extractPubSubPayload.js';

const reportErr = getReportErrorFn('locationCancelListener');

export interface LocationCancelPayload {
  policyId: string;
  locationId: string;
  cancelReason: CancellationReason;
  cancelEffDateMS: number;
}

export default async (
  event: CloudEvent<MessagePublishedData<LocationCancelPayload>>,
) => {
  info('LOCATION CANCEL EVENT - MSG JSON: ', {
    ...(event.data?.message?.json || {}),
  });

  const eventId = event.id;
  // let policyId = null;
  // let locationId = null;
  // let cancelReason = null;
  // let cancelEffDateMS = null;

  // try {
  //   policyId = event.data?.message?.json?.policyId;
  //   locationId = event.data?.message?.json?.locationId;
  //   cancelReason = event.data?.message?.json?.cancelReason || null;
  //   cancelEffDateMS = event.data?.message?.json?.cancelEffDateMS || null;
  // } catch (e) {
  //   reportErr('PubSub message was not JSON', {}, e);
  // }
  const { policyId, locationId, cancelReason, cancelEffDateMS } =
    extractPubSubPayload(event, [
      'policyId',
      'locationId',
      'cancelReason',
      'cancelEffDateMS',
    ]);

  try {
    verify(policyId && typeof policyId === 'string', 'missing policy ID');
    verify(locationId && typeof locationId === 'string', 'missing location ID');
    verify(cancelEffDateMS && isValid(new Date(cancelEffDateMS)));
  } catch (err: any) {
    const errMsg = err?.message || 'params error. returning early';
    reportErr(errMsg, {
      policyId,
      locationId,
      cancelEffDateMS,
    });
    return;
  }

  const db = getFirestore();
  const trxCol = transactionsCollection(db);
  let policy;
  let prevTrx;

  try {
    const policyRequest = fetchPolicyData(db, policyId);
    const prevTrxRequest = fetchPreviousTrx(
      db,
      policyId,
      locationId,
      premEndorsementPrevTypes,
    );

    const [policyRes, prevTrxRes] = await Promise.all([
      policyRequest,
      prevTrxRequest,
    ]);

    verify(policyRes, 'policy doc not found');
    verify(prevTrxRes, 'previous transaction not found');
    policy = policyRes;
    prevTrx = prevTrxRes;
  } catch (err: any) {
    const errMsg = err?.message || 'error fetching docs. returning early';
    reportErr(errMsg, {
      policyId,
      locationId,
      cancelEffDateMS,
    });
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
        cancelReason,
      );

      await trxRef.set({ ...offsetTrx });
    } else {
      warn(`Ignoring event. Transaction already processed ${trxId}`);
    }
  } catch (err: any) {
    reportErr(`Error saving cancel transaction`, { policyId, locationId }, err);
  }
};
