import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { info } from 'firebase-functions/logger';
import { getFirestore } from 'firebase-admin/firestore';

import { onCallWrapper } from '../services/sentry';
import { validate } from './utils';
import {
  DraftAddLocationRequest,
  changeRequestsCollection,
  locationsCollection,
  policiesCollection,
} from '../common';
import { createDocId } from '../modules/db';

interface AddLocationCalcProps {
  policyId: string;
  changeRequestId: string;
}

const addLocationCalc = async ({ data, auth }: CallableRequest<AddLocationCalcProps>) => {
  info(`Approve import called`, { ...data });

  const { changeRequestId, policyId } = data;
  validate(auth?.uid, 'unauthenticated', 'must be signed in');
  validate(policyId, 'failed-precondition', 'policyId required');
  validate(changeRequestId, 'failed-precondition', 'changeRequestId required');

  const db = getFirestore();
  const changeRequestCol = changeRequestsCollection(db, policyId);
  const changeRequestSnap = await changeRequestCol.doc(changeRequestId).get();
  const changeRequest = changeRequestSnap.data();

  validate(changeRequest, 'not-found', `change request does not exist (ID: ${changeRequestId})`);
  validate(
    changeRequest.status === 'draft',
    'failed-precondition',
    'change request already submitted. please create a new one.'
  );

  const policyCol = policiesCollection(db);
  const policySnap = await policyCol.doc(policyId).get();
  const policy = policySnap.data();

  validate(policy, 'not-found', `policy not found (ID: ${policyId})`);

  try {
    // get location doc if exists, otherwise --> create location document
    const { locationId, locationChanges } = changeRequest as DraftAddLocationRequest;
    const lcnId = locationId || createDocId();
    const locationRef = locationsCollection(db).doc(lcnId);

    // TODO: get location property values after address step ?? store data in locationChanges ??
    // add step before review step to ensure all location property data filled out ??

    // handle rating

    // calculate location premium values

    // calculate policy premium values

    // update change request

    // return new values
  } catch (err: any) {
    if (err instanceof HttpsError) throw err;
    throw new HttpsError('internal', 'Error rating/calculating premium');
  }
};

export default onCallWrapper<AddLocationCalcProps>('approveimport', addLocationCalc);
