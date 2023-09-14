import { CallableRequest } from 'firebase-functions/v2/https';
import { info } from 'firebase-functions/logger';

import { onCallWrapper } from '../services/sentry';
import { validate } from './utils';
import { changeRequestsCollection } from '../common';
import { getFirestore } from 'firebase-admin/firestore';

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

  try {
    // handle rating
    // get location doc if exists, otherwise --> create location document
    // calculate location premium values
    // calculate policy premium values
  } catch (err: any) {}
};

export default onCallWrapper<AddLocationCalcProps>('approveimport', addLocationCalc);
