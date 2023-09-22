import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';

import {
  CHANGE_REQUEST_STATUS,
  ChangeRequest,
  FeeItem,
  ILocation,
  LocationCancellationRequest,
  LocationChangeRequest,
  PolicyNew,
  TaxItem,
  changeRequestsCollection,
  locationsCollection,
  policiesCollectionNew,
  verify,
} from '../../common/index.js';
import { deepMergeOverwriteArrays } from '../utils/index.js';

function isLcnChangeReq(
  changeReq: ChangeRequest
): changeReq is LocationChangeRequest | LocationCancellationRequest {
  if (changeReq.scope === 'location') return true;
  return false;
}

export const mergePolicyLocationChanges = async (
  db: Firestore,
  policyId: string,
  requestId: string,
  reqUpdates: { processedByUserId: string; underwriterNotes?: string | null }
) => {
  const requestRef = changeRequestsCollection(db, policyId).doc(requestId);
  const policyRef = policiesCollectionNew(db).doc(policyId);

  return db.runTransaction(async (transaction) => {
    const requestSnap = await requestRef.get();
    const request = requestSnap.data();
    verify(requestSnap.exists && request, 'change request not found');

    const { policyChanges, trxType } = request;

    const isLcnScope = isLcnChangeReq(request); // scope === 'location';

    const locationChanges = isLcnScope ? request.locationChanges : {};
    const locationRef =
      isLcnScope && request.locationId
        ? locationsCollection(db).doc(request.locationId)
        : undefined;

    if (trxType === 'endorsement') {
      if (isLcnScope)
        verify(
          Object.keys(locationChanges || {}).includes('termPremium'),
          'endorsement change must have new "termPremium" value'
        );

      verify(
        Object.keys(policyChanges || {}).includes('termPremium'),
        'endorsement change missing policy "termPremium"  recalc'
      );
    }

    const policySnap = await transaction.get(policyRef);
    const locationSnap = locationRef ? await transaction.get(locationRef) : null;
    verify(policySnap.exists, 'Policy document does not exist');
    verify(!isLcnScope || locationSnap?.exists, 'Location document does not exist');

    info(`Updating policy (${policyId}) with changes (requestId: ${requestId})`, { ...request });

    const meta = { metadata: { updated: Timestamp.now() } };
    let res: { locationData?: ILocation } = {};

    // if location change request, create a new location doc
    if (locationSnap) {
      const newLocationData = deepMergeOverwriteArrays(locationSnap.data(), {
        ...locationChanges,
        ...meta,
      }) as ILocation;

      res['locationData'] = newLocationData;
    }

    let newPolicyData = deepMergeOverwriteArrays(policySnap.data(), {
      ...policyChanges,
      ...meta,
    }) as PolicyNew;

    const newTaxes = policyChanges?.taxes;
    if (newTaxes && Array.isArray(newTaxes)) newPolicyData.taxes = newTaxes as TaxItem[];

    const newFees = policyChanges?.fees;
    if (newFees && Array.isArray(newFees)) newPolicyData.fees = newFees as FeeItem[];

    console.log('NEW MERGED POLICY: ', newPolicyData);

    const requestUpdates = {
      ...reqUpdates,
      status: CHANGE_REQUEST_STATUS.ACCEPTED,
      processedTimestamp: Timestamp.now(),
      'metadata.updated': Timestamp.now(),
    };

    if (locationRef) transaction.set(locationRef, { ...(res.locationData || {}) }, { merge: true });
    transaction.set(policyRef, newPolicyData, { merge: true });
    transaction.set(requestRef, requestUpdates, { merge: true });

    return { ...res, policyData: newPolicyData };
  });
};
