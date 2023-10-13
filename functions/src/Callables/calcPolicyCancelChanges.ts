// TODO: combine with location cancel ??
import { isValid } from 'date-fns';
import { getFirestore } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { errorMap, fromZodError } from 'zod-validation-error';
import {
  CancellationRequest,
  ChangeRequest,
  ILocation,
  WithId,
  changeRequestsCollection,
  getReportErrorFn,
  locationsCollection,
  policiesCollectionNew,
} from '../common/index.js';
import { calcPolicyEndorsementChanges } from '../modules/rating/index.js';
import { calcTerm } from '../modules/transactions/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireAuth, validate } from './utils/index.js';

z.setErrorMap(errorMap);

const reportErr = getReportErrorFn('calcPolicyCancelChanges');

const CalcPolicyCancelChanges = z.object({
  policyId: z.string(),
  requestId: z.string(),
});
type CalcPolicyCancelChangesProps = z.infer<typeof CalcPolicyCancelChanges>;

function getValidatedData(data: unknown) {
  try {
    const parsedData = CalcPolicyCancelChanges.parse(data);
    return parsedData;
  } catch (err: any) {
    const validationError = fromZodError(err);
    throw new HttpsError('failed-precondition', validationError.message);
  }
}

const calcPolicyCancelChanges = async ({
  data,
  auth,
}: CallableRequest<CalcPolicyCancelChangesProps>) => {
  requireAuth(auth);
  const { policyId, requestId } = getValidatedData(data);

  const db = getFirestore();
  const policiesCol = policiesCollectionNew(db);
  const changeRequestsCol = changeRequestsCollection(db, policyId);
  const locationsCol = locationsCollection(db);

  try {
    const policyRef = policiesCol.doc(policyId);
    const changeRequestRef = changeRequestsCol.doc(requestId);
    const [policySnap, changeRequestSnap] = await Promise.all([
      policyRef.get(),
      changeRequestRef.get(),
    ]);
    // TODO: wrap fetching docs in try catch??

    const policy = policySnap.data();
    const changeRequest = changeRequestSnap.data() as unknown as CancellationRequest;

    validate(policy, 'not-found', `policy not found (ID: ${policyId})`);
    validate(changeRequest, 'not-found', `change request does not exist (ID: ${requestId})`);
    validate(
      changeRequest.status === 'draft',
      'failed-precondition',
      'Change request already submitted. Please create a new one.'
    );

    const { requestEffDate, formValues } = changeRequest;

    // TODO: use zod - custom timestamp validator
    validate(
      isValid(requestEffDate.toMillis()),
      'failed-precondition',
      'invalid cancel effective date'
    );
    validate(formValues.cancelReason, 'failed-precondition', 'cancel reason required');

    // TODO: how will transactions work if location cancel date if after policy nad needs to be recalculated ??
    // need to offset previous cancel trx
    // locations IDs, filtered for cancel locations < policy cancel eff date.
    const policyLcnEntries = Object.entries(policy.locations).filter(
      ([id, lcnSum]) =>
        !lcnSum.cancelEffDate ||
        (lcnSum.cancelEffDate && lcnSum.cancelEffDate.toMillis() > requestEffDate.toMillis())
    );

    const locationRefs = policyLcnEntries.map(([id]) => locationsCol.doc(id));
    const locationSnaps = await db.getAll(...locationRefs);
    const locations = locationSnaps.map((s) => ({ ...s.data(), id: s.id })) as WithId<ILocation>[];
    // TODO: validate locations ?? getAll with throw if one not found ??
    // use zod ??

    let cancellationChanges: CancellationRequest['cancellationChanges'] = {};

    for (let lcn of locations) {
      const { annualPremium, effectiveDate } = lcn;

      const { termPremium, termDays } = calcTerm(
        annualPremium,
        effectiveDate.toDate(),
        requestEffDate.toDate()
      );

      const lcnChanges = {
        termPremium,
        termDays,
        cancelEffDate: requestEffDate,
        cancelReason: formValues.cancelReason,
      };

      cancellationChanges[lcn.id] = lcnChanges;
    }

    const policyChanges = calcPolicyEndorsementChanges(policy, cancellationChanges, requestEffDate);

    const changeRequestUpdates: Partial<CancellationRequest> = {
      // locationChanges: cancellationChanges, // TODO: change locationChanges to object
      policyChanges,
      cancellationChanges,
      policyChangesCalcVersion: policy?.metadata?.version ?? null,
    };
    info(`saving cancel request changes...`, { changeRequestUpdates });

    // TODO: fix typing
    await changeRequestRef.set(changeRequestUpdates as unknown as ChangeRequest, { merge: true });

    return { formValues, policyChanges };
  } catch (err: any) {
    let errMsg = 'An error occurred';
    if (err?.message) errMsg += ` (${err.message})`;

    reportErr(errMsg, { auth, data }, err);

    if (err instanceof HttpsError) throw err;

    throw new HttpsError('internal', errMsg);
  }
};

export default onCallWrapper<CalcPolicyCancelChangesProps>(
  'calcpolicycancelchanges',
  calcPolicyCancelChanges
);
