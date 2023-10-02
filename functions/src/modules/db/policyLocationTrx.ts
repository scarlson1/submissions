import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';

import { merge } from 'lodash-es';
import {
  CHANGE_REQUEST_STATUS,
  ILocation,
  PolicyChangeRequest,
  PolicyNew,
  changeRequestsCollection,
  locationsCollection,
  policiesCollectionNew,
} from '../../common/index.js';
import { deepMergeOverwriteArrays, verify } from '../../utils/index.js';

export const mergePolicyLocationChanges = async (
  db: Firestore,
  policyId: string,
  requestId: string,
  reqUpdates: { processedByUserId: string; underwriterNotes?: string | null }
) => {
  const requestRef = changeRequestsCollection(db, policyId).doc(requestId);
  const policyRef = policiesCollectionNew(db).doc(policyId);
  const locationsCol = locationsCollection(db);

  return db.runTransaction(async (transaction) => {
    const requestSnap = await requestRef.get();
    const request = requestSnap.data();
    verify(requestSnap.exists && request, 'change request not found');

    const { endorsementChanges, amendmentChanges, policyChanges } =
      request as unknown as PolicyChangeRequest;

    // const { policyChanges, trxType } = request;

    // const isLcnScope = isLcnChangeReq(request);

    // const locationChanges = isLcnScope ? request.locationChanges : {};
    // const locationRef =
    //   isLcnScope && request.locationId
    //     ? locationsCollection(db).doc(request.locationId)
    //     : undefined;

    // if (trxType === 'endorsement') {
    //   if (isLcnScope)
    //     verify(
    //       Object.keys(locationChanges || {}).includes('termPremium'),
    //       'endorsement change must have new "termPremium" value'
    //     );

    //   verify(
    //     Object.keys(policyChanges || {}).includes('termPremium'),
    //     'endorsement change missing policy "termPremium"  recalc'
    //   );
    // }

    const locationChanges = merge(endorsementChanges || {}, amendmentChanges || {}); // TODO: add cancelChanges ?? (add location should store values under endorsementChanges ??)
    // what about reinstatement
    const locationIds = Object.keys(locationChanges);
    const locationRefs = locationIds.map((lcnId) => locationsCol.doc(lcnId));

    const policySnap = await transaction.get(policyRef);
    const policy = policySnap.data();
    // const locationSnap = locationRef ? await transaction.get(locationRef) : null;
    verify(policySnap.exists && policy, 'Policy document does not exist');
    // verify(!isLcnScope || locationSnap?.exists, 'Location document does not exist');
    // TODO: need to check if location docs exist ?? or assume they do? don't want to flatten and use update doc b/c of additional interest arrays
    const locationSnaps = await transaction.getAll(...locationRefs);
    const locations: Record<string, ILocation> = {};
    locationSnaps.forEach((snap) => {
      const lcnData = snap.data();
      if (!snap.exists || !lcnData) throw new Error(`location doc does not exist (${snap.id})`);
      locations[snap.id] = lcnData;
    });

    info(`Updating policy (${policyId}) with changes (requestId: ${requestId})`, { ...request });

    const meta = { metadata: { updated: Timestamp.now() } };
    let res: { locationData?: ILocation } = {};

    for (let [lcnId, lcnChanges] of Object.entries(locationChanges)) {
      // TODO: need to deep merge ?? instead of update ??
      let lcnData = locations[lcnId];
      const mergedLcn = deepMergeOverwriteArrays(lcnData, { ...lcnChanges, ...meta }) as ILocation;
      info(`merging location data ${lcnId}`, { lcnData, lcnChanges });

      transaction.set(locationsCol.doc(lcnId), mergedLcn, { merge: true });
    }

    let newPolicyData = deepMergeOverwriteArrays(policySnap.data(), {
      ...policyChanges,
      ...meta,
    }) as PolicyNew;

    const requestUpdates = {
      ...reqUpdates,
      status: CHANGE_REQUEST_STATUS.ACCEPTED,
      processedTimestamp: Timestamp.now(),
      'metadata.updated': Timestamp.now(),
      mergedWithPolicyVersion: policy.metadata?.version || null,
    };

    transaction.set(policyRef, newPolicyData, { merge: true });
    transaction.update(requestRef, requestUpdates);

    return { ...res, policyData: newPolicyData };
  });
};

// import { Firestore, Timestamp } from 'firebase-admin/firestore';
// import { info } from 'firebase-functions/logger';

// import {
//   CHANGE_REQUEST_STATUS,
//   ChangeRequest,
//   FeeItem,
//   ILocation,
//   LocationCancellationRequest,
//   LocationChangeRequest,
//   PolicyNew,
//   TaxItem,
//   changeRequestsCollection,
//   locationsCollection,
//   policiesCollectionNew,
// } from '../../common/index.js';
// import { verify, deepMergeOverwriteArrays } from '../../utils/index.js';

// function isLcnChangeReq(
//   changeReq: ChangeRequest
// ): changeReq is LocationChangeRequest | LocationCancellationRequest {
//   if (changeReq.scope === 'location') return true;
//   return false;
// }

// export const mergePolicyLocationChanges = async (
//   db: Firestore,
//   policyId: string,
//   requestId: string,
//   reqUpdates: { processedByUserId: string; underwriterNotes?: string | null }
// ) => {
//   const requestRef = changeRequestsCollection(db, policyId).doc(requestId);
//   const policyRef = policiesCollectionNew(db).doc(policyId);

//   return db.runTransaction(async (transaction) => {
//     const requestSnap = await requestRef.get();
//     const request = requestSnap.data();
//     verify(requestSnap.exists && request, 'change request not found');

//     const { policyChanges, trxType } = request;

//     const isLcnScope = isLcnChangeReq(request);

//     const locationChanges = isLcnScope ? request.locationChanges : {};
//     const locationRef =
//       isLcnScope && request.locationId
//         ? locationsCollection(db).doc(request.locationId)
//         : undefined;

//     if (trxType === 'endorsement') {
//       if (isLcnScope)
//         verify(
//           Object.keys(locationChanges || {}).includes('termPremium'),
//           'endorsement change must have new "termPremium" value'
//         );

//       verify(
//         Object.keys(policyChanges || {}).includes('termPremium'),
//         'endorsement change missing policy "termPremium"  recalc'
//       );
//     }

//     const policySnap = await transaction.get(policyRef);
//     const locationSnap = locationRef ? await transaction.get(locationRef) : null;
//     verify(policySnap.exists, 'Policy document does not exist');
//     verify(!isLcnScope || locationSnap?.exists, 'Location document does not exist');

//     info(`Updating policy (${policyId}) with changes (requestId: ${requestId})`, { ...request });

//     const meta = { metadata: { updated: Timestamp.now() } };
//     let res: { locationData?: ILocation } = {};

//     // TODO: if policy cancellation --> loop through location changes or handle in different transaction ??
//     // policy cancel: location changes stored as { [lcnId]: changes }
//     if (!isLcnScope && trxType === 'cancellation')
//       throw new Error(
//         'mergePolicyLocationChanges not set up to merge policy cancellation doc changes'
//       );

//     // if location change request, create a new location doc
//     if (locationSnap) {
//       const newLocationData = deepMergeOverwriteArrays(locationSnap.data(), {
//         ...locationChanges,
//         ...meta,
//       }) as ILocation;

//       res['locationData'] = newLocationData;
//     }

//     let newPolicyData = deepMergeOverwriteArrays(policySnap.data(), {
//       ...policyChanges,
//       ...meta,
//     }) as PolicyNew;

//     // necessary ?? or was this before using custom deep merge (overwrite arrays) ??
//     const newTaxes = policyChanges?.taxes;
//     if (newTaxes && Array.isArray(newTaxes)) newPolicyData.taxes = newTaxes as TaxItem[];

//     const newFees = policyChanges?.fees;
//     if (newFees && Array.isArray(newFees)) newPolicyData.fees = newFees as FeeItem[];

//     console.log('NEW MERGED POLICY: ', newPolicyData);

//     const requestUpdates = {
//       ...reqUpdates,
//       status: CHANGE_REQUEST_STATUS.ACCEPTED,
//       processedTimestamp: Timestamp.now(),
//       'metadata.updated': Timestamp.now(),
//       mergedWithPolicyVersion: policyChanges?.metadata?.version || null,
//     };

//     if (locationRef) transaction.set(locationRef, { ...(res.locationData || {}) }, { merge: true });
//     transaction.set(policyRef, newPolicyData, { merge: true });
//     transaction.update(requestRef, requestUpdates);
//     // transaction.set(requestRef, requestUpdates, { merge: true });

//     return { ...res, policyData: newPolicyData };
//   });
// };
