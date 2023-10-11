import { isValid } from 'date-fns';
import { getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import {
  CancellationRequest,
  ChangeRequest,
  changeRequestsCollection,
  getReportErrorFn,
  locationsCollection,
  policiesCollectionNew,
} from '../common/index.js';
import { calcPolicyEndorsementChanges } from '../modules/rating/index.js';
import { calcTerm } from '../modules/transactions/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireAuth, validate } from './utils/index.js';

// TODO: handle flat_cancel
// TODO: handle policy cancel (see handleCancelRating.ts)

// set trxType to flat_cancel if req eff date before location eff date
// or handle after approved ?? risk of mismatch in calculations ??

const reportErr = getReportErrorFn('calcAddLocation');

interface CalcCancelChangesProps {
  policyId: string;
  requestId: string;
}

type CalcCancelChangesResponse = Pick<
  CancellationRequest,
  'locationChanges' | 'policyChanges' | 'formValues'
>;

const calcCancelChange = async ({ data, auth }: CallableRequest<CalcCancelChangesProps>) => {
  const { policyId, requestId } = data;

  requireAuth(auth);
  validate(policyId, 'failed-precondition', 'policyId required');
  validate(requestId, 'failed-precondition', 'requestId required');

  const db = getFirestore();
  const policiesCol = policiesCollectionNew(db);
  const changeRequestsCol = changeRequestsCollection(db, policyId);
  const locationsCol = locationsCollection(db);

  const policyRef = policiesCol.doc(policyId);
  const changeRequestRef = changeRequestsCol.doc(requestId);
  const [policySnap, changeRequestSnap] = await Promise.all([
    policyRef.get(),
    changeRequestRef.get(),
  ]);

  const policy = policySnap.data();
  const changeRequest = changeRequestSnap.data() as unknown as CancellationRequest;

  validate(policy, 'not-found', `policy not found (ID: ${policyId})`);
  validate(changeRequest, 'not-found', `change request does not exist (ID: ${requestId})`);
  validate(
    changeRequest.status === 'draft',
    'failed-precondition',
    'Change request already submitted. Please create a new one.'
  );

  try {
    // TODO: validate type / fix typing
    const { locationId, requestEffDate, formValues } = changeRequest; //  as unknown as CancellationRequest;

    validate(
      isValid(requestEffDate.toMillis()),
      'failed-precondition',
      'invalid cancel effective date'
    );
    validate(formValues.cancelReason, 'failed-precondition', 'cancel reason required');
    // TODO: validate after today ?? allow admin to have past date

    const locationSnap = await locationsCol.doc(locationId).get();
    const location = locationSnap.data();

    validate(location, 'failed-precondition', 'location not found');

    const { annualPremium, effectiveDate } = location;
    // recalc term premium / term days
    const { termPremium, termDays } = calcTerm(
      annualPremium,
      effectiveDate.toDate(),
      requestEffDate.toDate()
    );
    validate(termPremium && termDays, 'internal', 'error calculating location term premium');

    const locationChanges = {
      termPremium,
      termDays,
      cancelEffDate: requestEffDate,
      cancelReason: formValues.cancelReason,
    };

    // recalc policy values
    const policyChanges = calcPolicyEndorsementChanges(
      policy,
      {
        [locationId]: locationChanges,
      },
      requestEffDate
    );

    const changeRequestUpdates: Partial<CancellationRequest> = {
      locationChanges,
      policyChanges,
      cancellationChanges: {
        [locationId]: locationChanges,
      },
      policyChangesCalcVersion: policy?.metadata?.version ?? null,
    };
    info(`saving cancel request changes...`, { changeRequestUpdates });
    // TODO: fix typing (new schema)
    await changeRequestRef.set(changeRequestUpdates as unknown as ChangeRequest, { merge: true });

    // TODO: fix typing
    // @ts-ignore
    const res: CalcCancelChangesResponse = { formValues, locationChanges, policyChanges };

    return res;
  } catch (err: any) {
    let errMsg = `Error calculating cancellation changes`;
    if (err?.message) errMsg += ` (${err?.message})`;
    reportErr(errMsg, {}, err);

    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', errMsg);
  }
};

export default onCallWrapper<CalcCancelChangesProps>('calccancelchange', calcCancelChange);
