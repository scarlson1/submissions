import { deepmerge } from 'deepmerge-ts';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import {
  CHANGE_REQUEST_STATUS,
  Policy,
  PolicyLocation,
  changeReqestsCollection,
  policiesCollection,
  verify,
} from '../common';
import { onCallWrapper } from '../services/sentry';
import { getDoc, requireIDemandAdminClaims, validate } from './utils';

// TODO: validation
//    - if endorsement, make sure endorsement calculation executed successfully, etc.

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

    if (request.scope === 'policy') {
      // use update ?? update will throw if doc not found (requires dot notation)
      batch.set(
        policyRef,
        { ...request.changes, metadata: { updated: Timestamp.now() } } as Policy,
        { merge: true }
      );
    }

    // TODO: need to store location scope changes with policy depth b/c premium recalc will require recalcing premium, taxes & fees at policy level
    if (request.scope === 'location') {
      const { locationId, changes } = request;
      const policy = await getDoc(policyRef);
      const location = policy.locations[locationId];
      if (!location) throw new Error(`Location not found on policy`);

      const mergedLocation = deepmerge(location, changes);

      // If using batch.update --> use dot notation ([`locations.${locationId}`]: mergedLocation)
      // If using batch.set --> do not use dot notation
      const updates = {
        locations: { [locationId]: mergedLocation as PolicyLocation },
      };

      batch.set(policyRef, updates, { merge: true });
    }

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
    error('Error saving batch transaction to merge policy change request', {
      ...err,
      policyId,
      requestId,
    });
    throw new HttpsError('internal', 'Error upating policy record');
  }

  return { status: 'ok' };
};

export default onCallWrapper<ApproveRequestProps>('approvechangerequest', approveChangeRequest);
