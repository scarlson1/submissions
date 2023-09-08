// import { deepmerge } from 'deepmerge-ts';
import { getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import { changeRequestsCollection, getReportErrorFn } from '../common';
import { setChangeRequestErr } from '../modules/transactions';
import { onCallWrapper } from '../services/sentry';
import { requireIDemandAdminClaims, validate } from './utils'; // getDoc,
import { mergePolicyLocationChanges } from '../modules/db';

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

  // const policyRef = policiesCollection(db).doc(policyId);
  const requestRef = changeRequestsCollection(db, policyId).doc(requestId);

  // await getDoc(policyRef); // will throw if doc doesn't exist
  // const request = await getDoc(requestRef);
  // const { scope, trxType, policyChanges } = request;
  // const isLcnScope = request.scope === 'location';

  // // TODO: validation (& firestore rules for required fields)
  // try {
  //   verify(scope, 'missing "scope" field on request doc');
  //   if (trxType === 'endorsement') {
  //     if (isLcnScope)
  //       verify(
  //         Object.keys(request.locationChanges).includes('termPremium'),
  //         'endorsement change must have new "termPremium" value'
  //       );

  //     verify(
  //       Object.keys(policyChanges || {}).includes('termPremium'),
  //       'endorsement change missing policy "termPremium"  recalc'
  //     );
  //   }
  // } catch (err: any) {
  //   reportErr(
  //     'Error - change request approval validation failed',
  //     {
  //       err,
  //       policyId,
  //       requestId,
  //     },
  //     err
  //   );
  //   let msg = err?.message || 'change validation failed';
  //   throw new HttpsError('failed-precondition', msg);
  // }

  // let locationRef;
  // if (isLcnScope) {
  //   // TODO: handle in firestore transaction
  //   try {
  //     locationRef = locationsCollection(db).doc(request.locationId);
  //     let locationSnap = await locationRef.get();
  //     verify(locationSnap.exists);
  //   } catch (err: any) {
  //     let msg = `location record not found`;
  //     reportErr(
  //       msg,
  //       {
  //         err,
  //         policyId,
  //         requestId,
  //       },
  //       err
  //     );
  //     throw new HttpsError('not-found', msg);
  //   }
  // }

  try {
    const { locationData, policyData } = await mergePolicyLocationChanges(db, policyId, requestId, {
      processedByUserId: auth?.uid || '',
      underwriterNotes: underwriterNotes || null,
    });

    info(`merge change request (${requestId})`, {
      locationData: locationData || null,
      policyData,
      // policyChanges: request.policyChanges || null,
      policyId,
      requestId,
    });

    // const batch = db.batch();

    // if (isLcnScope) {
    //   verify(locationRef);
    //   batch.set(
    //     locationRef,
    //     { ...request.locationChanges, metadata: { updated: Timestamp.now() } } as ILocation,
    //     { merge: true }
    //   );
    // }

    // batch.set(
    //   policyRef,
    //   { ...request.policyChanges, metadata: { updated: Timestamp.now() } } as Policy,
    //   {
    //     merge: true,
    //   }
    // );

    // batch.update(requestRef, {
    //   status: CHANGE_REQUEST_STATUS.ACCEPTED,
    //   processedByUserId: auth?.uid || '',
    //   processedTimestamp: Timestamp.now(),
    //   underwriterNotes: underwriterNotes || null,
    //   'metadata.updated': Timestamp.now(),
    // });

    // await batch.commit();

    // info(`Policy changes merged (policy: ${policyId}; request: ${requestId})`, {
    //   policyChanges: request.policyChanges || null,
    //   policyId,
    //   requestId,
    // });
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
