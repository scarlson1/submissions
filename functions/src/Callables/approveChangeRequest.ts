// import { deepmerge } from 'deepmerge-ts';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import {
  CHANGE_REQUEST_STATUS,
  Policy,
  changeReqestsCollection,
  getReportErrorFn,
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
  const requestRef = changeReqestsCollection(db, policyId).doc(requestId);

  await getDoc(policyRef); // will throw if doc doesn't exist
  const request = await getDoc(requestRef);

  // TODO: validation (& firestore rules for required fields)
  try {
    verify(request.scope, 'missing "scope" field on request doc');
    if (request.trxType === 'endorsement') {
      const keys = Object.keys(request.changes);
      verify(keys.includes('termPremium'), 'endorsement change must have new "termPremium" value');
    }
  } catch (err: any) {
    error('Error - change request approval validation failed', {
      err,
      policyId,
      requestId,
    });
    let msg = err?.message || 'change validation failed';
    throw new HttpsError('failed-precondition', msg);
  }

  try {
    info(`Updating policy with changes (requestId: ${requestId})`, { ...request });
    const batch = db.batch();

    batch.set(policyRef, { ...request.changes, metadata: { updated: Timestamp.now() } } as Policy, {
      merge: true,
    });

    batch.update(requestRef, {
      status: CHANGE_REQUEST_STATUS.ACCEPTED,
      processedByUserId: auth?.uid || '',
      processedTimestamp: Timestamp.now(),
      underwriterNotes: underwriterNotes || null,
      'metadata.updated': Timestamp.now(),
    });

    await batch.commit();

    info(`Policy changes merged (policy: ${policyId}; request: ${requestId})`, {
      changes: request.changes,
      policyId,
      requestId,
    });
  } catch (err: any) {
    const errMsg = `Error saving batch transaction to merge policy changes (${
      err?.message ?? 'unknown'
    })`;
    setChangeRequestErr(requestRef, errMsg);

    reportErr(errMsg, { policyId, requestId }, err);
    throw new HttpsError('internal', 'Error upating policy record');
  }

  return { status: 'ok' };
};

export default onCallWrapper<ApproveRequestProps>('approvechangerequest', approveChangeRequest);
