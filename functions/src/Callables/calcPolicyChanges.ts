import { getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import {
  ChangeRequestStatus,
  changeRequestsCollection,
  getReportErrorFn,
  policiesCollectionNew,
} from '../common/index.js';
import { calcPolicyEndorsementChanges } from '../modules/rating/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { validate } from './utils/index.js';

interface CalcPolicyChangesProps {
  policyId: string;
  changeRequestId: string;
}

const reportErr = getReportErrorFn('calcpolicychanges');

// TODO: need corresponding function for calculating location changes (calcLocationChanges ??)
//  - called before review step
//  - accepts values from form (or should it pass the change request ID ??)
//      - if using values from change request, need to save form values before calling fn
//  - will look similar to add location fn (should be used by both ??)
//  - separate request types into different functions (or set up as express onRequest api)

// calculation scenarios:
//    - add location or endorsement (requires SR api call )
//        - separate out to another route (calc location changes - fine if location changes gets overwritten by another change request)
//`       - calculates location changes. store as entire location, or as changes / diff ??
//        - store location changes as object with location ID
//    - policy endorsement calc - needs to be called at change request creation, at review step, at approval (reusable function, recalculate in approval merge function ??)
//        - should values be stored in change request ?? add "calc date" field, and lock down document once status is approved

export const PROCESSED_STATUS: ChangeRequestStatus[] = ['accepted', 'cancelled', 'denied'];

const calcPolicyChanges = async ({ data, auth }: CallableRequest<CalcPolicyChangesProps>) => {
  info(`Calc Policy Changes called`, { ...data });

  const { changeRequestId, policyId } = data;
  validate(auth?.uid, 'unauthenticated', 'must be signed in');
  validate(policyId, 'failed-precondition', 'policyId required');
  validate(changeRequestId, 'failed-precondition', 'changeRequestId required');

  const db = getFirestore();
  const policyCol = policiesCollectionNew(db);
  const changeRequestCol = changeRequestsCollection(db, policyId);

  const changeRequestSnap = await changeRequestCol.doc(changeRequestId).get();
  const changeRequest = changeRequestSnap.data();
  validate(changeRequest, 'not-found', `change request does not exist (ID: ${changeRequestId})`);
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

  let policyChanges;
  try {
    // if add_location or endorsement --> calcEndorsement

    const { trxType, scope, requestEffDate } = changeRequest;

    if (trxType === 'endorsement' && scope === 'location') {
      // TODO: validation for each type of request
      const tempLocationsObj = {
        [changeRequest.locationId]: {
          ...changeRequest.locationChanges,
        },
      };
      policyChanges = calcPolicyEndorsementChanges(policy, tempLocationsObj, requestEffDate);
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

  if (!policyChanges) throw new HttpsError('internal', 'unable to determine change request type');

  try {
    // TODO: validate policyChanges ??
    // separate returning value from saving to file (outside try/catch) ??
    await changeRequestSnap.ref.set(
      {
        policyChanges,
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
