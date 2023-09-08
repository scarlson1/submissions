import { deepmerge } from 'deepmerge-ts';
import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';

import {
  CHANGE_REQUEST_STATUS,
  ILocation,
  PolicyNew,
  changeRequestsCollection,
  locationsCollection,
  policiesCollectionNew,
  verify,
} from '../../common';
// import { createDocId } from './helpers';

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

    const { scope, policyChanges, trxType } = request;

    const isLcnScope = scope === 'location';

    // const locationId = isLcnScope ? request.locationId : undefined;
    const locationChanges = isLcnScope ? request.locationChanges : {};
    const locationRef =
      isLcnScope && request.locationId
        ? locationsCollection(db).doc(request.locationId)
        : undefined;
    // const newLocationRef = isLcnScope ? locationsCollection(db).doc(createDocId()) : undefined;

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
      // && newLocationRef
      const newLocationData = deepmerge(locationSnap.data(), {
        ...locationChanges,
        ...meta,
      }) as ILocation;

      // transaction.set(newLocationRef, newLocationData);
      res['locationData'] = newLocationData;
    }

    // const policyMergeArr = [
    //   policySnap.data(),
    //   {
    //     ...policyChanges,
    //     ...meta,
    //   },
    // ] as Partial<PolicyNew>[];

    // // if location change, update location doc ref
    // if (locationId && newLocationRef) {
    //   policyMergeArr.push({
    //     locations: {
    //       [locationId]: {
    //         lcnDocId: newLocationRef.id,
    //       },
    //     },
    //   } as Partial<PolicyNew>);
    // }
    const newPolicyData = deepmerge(policySnap.data(), {
      ...policyChanges,
      ...meta,
    }) as PolicyNew;

    const requestUpdates = {
      ...reqUpdates,
      status: CHANGE_REQUEST_STATUS.ACCEPTED,
      processedTimestamp: Timestamp.now(),
      'metadata.updated': Timestamp.now(),
    };

    // if (newLocationRef && res.locationData) transaction.set(newLocationRef, res.locationData);
    transaction.set(policyRef, newPolicyData, { merge: true });
    transaction.set(requestRef, requestUpdates, { merge: true });

    return { ...res, policyData: newPolicyData };
  });

  // const policyRef = policiesCollectionNew(db).doc(policyId);
  // const locationRef = locationsCollection(db).doc(locationId);
  // const newLocationRef = locationsCollection(db).doc(createDocId());

  // return db.runTransaction(async (transaction) => {
  //   const [policySnap, locationSnap] = await Promise.all([
  //     transaction.get(policyRef),
  //     transaction.get(locationRef),
  //   ]);
  //   verify(policySnap.exists, 'Policy document does not exist');
  //   verify(locationSnap, 'Location document does not exist');

  //   const meta = { metadata: { updated: Timestamp.now() } };

  //   const newLocationData = deepmerge(locationSnap.data(), {
  //     ...locationChanges,
  //     ...meta,
  //   }) as Partial<ILocation>;

  //   const newPolicyData = deepmerge(
  //     policySnap.data(),
  //     {
  //       ...policyChanges,
  //       ...meta,
  //     },
  //     {
  //       locations: {
  //         [locationId]: {
  //           lcnDocId: newLocationRef.id,
  //         },
  //       },
  //     }
  //   ) as Partial<PolicyNew>;

  //   await transaction.set(newLocationRef, newLocationData);
  //   await transaction.set(policyRef, newPolicyData, { merge: true });

  //   return { newLocationData, newPolicyData };
  // });
};
