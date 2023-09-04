// import { deepmerge } from 'deepmerge-ts';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import {
  CHANGE_REQUEST_STATUS,
  ILocation,
  Policy,
  changeRequestsCollection,
  getReportErrorFn,
  locationsCollection,
  policiesCollection,
  verify,
} from '../common';
import { setChangeRequestErr } from '../modules/transactions';
import { onCallWrapper } from '../services/sentry';
import { getDoc, requireIDemandAdminClaims, validate } from './utils';

// TODO: validation
//    - if endorsement, make sure endorsement calculation executed successfully, etc.

const reportErr = getReportErrorFn('approveChangeRequest');

interface ApproveRequestProps {
  policyId: string;
  requestId: string;
  underwriterNotes?: string;
}

const approveChangeRequest = async ({ data, auth }: CallableRequest<ApproveRequestProps>) => {
  info('Approve request called', { ...data });

  requireIDemandAdminClaims(auth?.token);

  const { policyId, requestId, underwriterNotes } = data;
  validate(policyId, 'failed-precondition', 'policyId required');
  validate(requestId, 'failed-precondition', 'requestId required');

  const db = getFirestore();

  const policyRef = policiesCollection(db).doc(policyId);
  const requestRef = changeRequestsCollection(db, policyId).doc(requestId);

  await getDoc(policyRef); // will throw if doc doesn't exist
  const request = await getDoc(requestRef);

  // TODO: validation (& firestore rules for required fields)
  try {
    verify(request.scope, 'missing "scope" field on request doc');
    if (request.trxType === 'endorsement') {
      if (request.scope === 'location') {
        const keys = Object.keys(request.locationChanges);
        verify(
          keys.includes('termPremium'),
          'endorsement change must have new "termPremium" value'
        );
      }
      const policyKeys = Object.keys(request?.policyChanges || {});
      verify(
        policyKeys.includes('termPremium'),
        'endorsement change missing policy "termPremium"  recalc'
      );
    }
  } catch (err: any) {
    reportErr(
      'Error - change request approval validation failed',
      {
        err,
        policyId,
        requestId,
      },
      err
    );
    let msg = err?.message || 'change validation failed';
    throw new HttpsError('failed-precondition', msg);
  }

  let locationRef;
  if (request.scope === 'location') {
    try {
      locationRef = locationsCollection(db).doc(request.locationId);
      let locationSnap = await locationRef.get();
      verify(locationSnap.exists);
    } catch (err: any) {
      let msg = `location record not found`;
      reportErr(
        msg,
        {
          err,
          policyId,
          requestId,
        },
        err
      );
      throw new HttpsError('not-found', msg);
    }
  }

  try {
    info(`Updating policy (${policyId}) with changes (requestId: ${requestId})`, { ...request });
    const batch = db.batch();

    if (request.scope === 'location') {
      verify(locationRef);
      batch.set(
        locationRef,
        { ...request.locationChanges, metadata: { updated: Timestamp.now() } } as ILocation,
        { merge: true }
      );
    }

    batch.set(
      policyRef,
      { ...request.policyChanges, metadata: { updated: Timestamp.now() } } as Policy,
      {
        merge: true,
      }
    );

    batch.update(requestRef, {
      status: CHANGE_REQUEST_STATUS.ACCEPTED,
      processedByUserId: auth?.uid || '',
      processedTimestamp: Timestamp.now(),
      underwriterNotes: underwriterNotes || null,
      'metadata.updated': Timestamp.now(),
    });

    await batch.commit();

    info(`Policy changes merged (policy: ${policyId}; request: ${requestId})`, {
      policyChanges: request.policyChanges || null,
      policyId,
      requestId,
    });
  } catch (err: any) {
    const errMsg = `Error saving batch transaction to merge policy changes (${
      err?.message ?? 'unknown'
    })`;
    setChangeRequestErr(requestRef, errMsg);

    reportErr(errMsg, { policyId, requestId }, err);
    throw new HttpsError('internal', 'Error updating policy record');
  }

  return { status: 'ok' };
};

export default onCallWrapper<ApproveRequestProps>('approvechangerequest', approveChangeRequest);
