import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import { onCallWrapper } from '../services/sentry';
import { requireIDemandAdminClaims } from './utils';
import { DocumentReference, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { CHANGE_REQUEST_STATUS, changeReqestsCollection, policiesCollection } from '../common';

// const POLICY_UPDATEABLE_FIELDS = [
//   'limits.limitA',
//   'limits.limitB',
//   'limits.limitC',
//   'limits.limitD',
//   'metadata.updated',
// ]; // TODO: complete fields list if using this check

interface ApproveRequestProps {
  policyId: string;
  requestId: string;
  underWriterNotes?: string;
}

const approveChangeRequest = async ({ data, auth }: CallableRequest<ApproveRequestProps>) => {
  info('Approve request called', { ...data });

  requireIDemandAdminClaims(auth?.token);

  const { policyId, requestId, underWriterNotes } = data;
  if (!(policyId && requestId))
    throw new HttpsError('failed-precondition', 'policyId and requestId required');

  const db = getFirestore();

  const policyRef = policiesCollection(db).doc(policyId);
  const requestRef = changeReqestsCollection(db, policyId).doc(requestId);

  // await getDoc(policyRef);
  const request = await getDoc(requestRef);

  // TODO: validation ??

  // TODO: requires deep merge if using diff (or converting keys to dot notation strings)
  try {
    const batch = db.batch();

    // use update ?? update will throw if doc not found
    batch.set(
      policyRef, // @ts-ignore
      { ...request.changes, 'metadata.updated': Timestamp.now() },
      { merge: true } // mergeFields: POLICY_UPDATEABLE_FIELDS
    ); // does mergeFields keep value from original record if no new value is included in update ??

    batch.update(requestRef, {
      status: CHANGE_REQUEST_STATUS.ACCEPTED,
      approvedByUserId: auth?.uid || '',
      processedTimestamp: Timestamp.now(),
      underWriterNotes: underWriterNotes || null,
      'metadata.updated': Timestamp.now(),
    });

    await batch.commit();

    info(`Policy changes merged (policy: ${policyId}; request: ${requestId})`, {
      changes: request.changes,
      policyId,
      requestId,
    });
  } catch (err: any) {
    error('Error saving batch transaction to merge policy change request', {
      ...err,
      policyId,
      requestId,
    });
    throw new HttpsError('internal', 'Error upating policy record');
  }

  try {
  } catch (err: any) {
    throw new HttpsError(
      'internal',
      'policy changes merged, but emitting event for transactions failed.'
    );
  }

  return { status: 'ok' };
};

export default onCallWrapper<ApproveRequestProps>('approvechangerequest', approveChangeRequest);

async function getDoc<T>(docRef: DocumentReference<T>) {
  const snap = await docRef.get();
  const data = snap.data();
  if (!snap.exists || !data) throw new HttpsError('not-found', 'record not found');
  return data;
}
