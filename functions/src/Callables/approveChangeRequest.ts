import { getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import { changeRequestsCollection, getReportErrorFn } from '../common/index.js';
import { mergePolicyLocationChanges } from '../modules/db/index.js';
import { setChangeRequestErr } from '../modules/transactions/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireIDemandAdminClaims, validate } from './utils/index.js';

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
  const requestRef = changeRequestsCollection(db, policyId).doc(requestId);

  try {
    const { locationData, policyData } = await mergePolicyLocationChanges(db, policyId, requestId, {
      processedByUserId: auth?.uid || '',
      underwriterNotes: underwriterNotes || null,
    });

    info(`merge change request (${requestId})`, {
      locationData: locationData || null,
      policyData,
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
