import { getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import {
  ChangeRequestStatus,
  changeRequestsCollection,
  getReportErrorFn,
  policiesCollection,
} from '../common/index.js';
import { calcPolicyEndorsementChanges } from '../modules/rating/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireAuth, validate } from './utils/index.js';

interface CalcPolicyChangesProps {
  policyId: string;
  requestId: string;
}

const reportErr = getReportErrorFn('calcpolicychanges');

// calculation scenarios:
//    - add location or endorsement (requires SR api call )
//        - separate out to another route (calc location changes - fine if location changes gets overwritten by another change request)
//`       - calculates location changes. store as entire location, or as changes / diff ??
//        - store location changes as object with location ID
//    - policy endorsement calc - needs to be called at change request creation, at review step, at approval (reusable function, recalculate in approval merge function ??)
//        - should values be stored in change request ?? add "calc date" field, and lock down document once status is approved
//  - should "locationChanges" be stored in the doc or calculated each time ?? (need to update to new schema for multi-location)

export const PROCESSED_STATUS: ChangeRequestStatus[] = ['accepted', 'cancelled', 'denied'];

const calcPolicyChanges = async ({ data, auth }: CallableRequest<CalcPolicyChangesProps>) => {
  info(`Calc Policy Changes called`, { ...data });

  const { requestId, policyId } = data;
  requireAuth(auth);
  validate(policyId, 'failed-precondition', 'policyId required');
  validate(requestId, 'failed-precondition', 'changeRequestId required');

  const db = getFirestore();
  const policyCol = policiesCollection(db);
  const changeRequestCol = changeRequestsCollection(db, policyId);

  const changeRequestSnap = await changeRequestCol.doc(requestId).get();
  const changeRequest = changeRequestSnap.data();

  validate(changeRequest, 'not-found', `change request does not exist (ID: ${requestId})`);
  validate(
    !PROCESSED_STATUS.includes(changeRequest?.status),
    'failed-precondition',
    `change request already processed`
  );

  // TODO: validate location changes exist (if location change request)
  // TODO: validate policy changes if policy level change

  const policySnap = await policyCol.doc(policyId).get();
  const policy = policySnap.data();

  validate(policy, 'not-found', `policy not found (ID: ${policyId})`);

  // TODO: split into reusable functions by change type
  // store functions under modules/rating

  let policyChanges = {};
  try {
    // if add_location or endorsement --> calcEndorsement
    const { trxType, scope, requestEffDate } = changeRequest;

    // TODO: remove ?? once new schema is set up
    // all change request schemas should match "changes" keys
    // --> check if locationChanges is empty
    // if (!isEmpty(changeRequest.locationChanges || {})) {
    if (trxType === 'endorsement' && scope === 'location') {
      // TODO: validation for each type of request
      const tempLocationsObj = {
        [changeRequest.locationId]: {
          ...(changeRequest.locationChanges || {}),
        },
      };
      policyChanges = calcPolicyEndorsementChanges(policy, tempLocationsObj, requestEffDate);
    } else {
      // TODO: handle add location, reinstatement, amendment, etc.
      throw new HttpsError(
        'unimplemented',
        'function not set up to handle trx other than endorsement'
      );
    }

    // if location cancellation (or policy cancellation) --> calcCancellation
    // same as above (calcPolicyEndorsementChanges)  ??
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;

    let msg = 'Error calculating policy changes';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, {}, err);
    throw new HttpsError('internal', msg);
  }

  // if (!policyChanges) throw new HttpsError('internal', 'unable to determine change request type');

  try {
    // TODO: validate policyChanges ??
    // separate returning value from saving to file (outside try/catch) ??
    await changeRequestSnap.ref.set(
      {
        policyChanges, // @ts-ignore TODO: remove ignore once using new type
        policyChangesCalcVersion: policy?.metadata?.version ?? null,
      },
      { merge: true }
    );

    return { ...policyChanges };
  } catch (err: any) {
    let msg = 'Error saving policy changes';
    if (err?.message) msg += ` (${err.message})`;
    reportErr(msg, {}, err);
    throw new HttpsError('internal', msg);
  }
};

export default onCallWrapper<CalcPolicyChangesProps>('calcpolicychanges', calcPolicyChanges);
