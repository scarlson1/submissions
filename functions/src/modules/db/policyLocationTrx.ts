import { deepmerge } from 'deepmerge-ts';
import { Firestore, Timestamp } from 'firebase-admin/firestore';

import {
  DeepPartial,
  ILocation,
  PolicyNew,
  locationsCollection,
  policiesCollectionNew,
  verify,
} from '../../common';
import { createDocId } from './helpers';

// STEPS IF CHANGES TO FLAT LOCATION VERSION:
//    - use transaction
//    - get location
//    - get policy
//    - merge location changes with location for new doc
//    - merge policy changes with policy
//    - save policy & new location

interface PolicyLocationTrxProps {
  policyId: string;
  locationId: string;
  changeRequestId: string;
  policyChanges: DeepPartial<PolicyNew>;
  locationChanges: DeepPartial<ILocation>;
}

// TODO: rename

export const policyLocationTrx = async (
  db: Firestore,
  { policyId, locationId, policyChanges, locationChanges }: PolicyLocationTrxProps
) => {
  const policyRef = policiesCollectionNew(db).doc(policyId);
  const locationRef = locationsCollection(db).doc(locationId);
  const newLocationRef = locationsCollection(db).doc(createDocId());

  return db.runTransaction(async (transaction) => {
    const [policySnap, locationSnap] = await Promise.all([
      transaction.get(policyRef),
      transaction.get(locationRef),
    ]);
    verify(policySnap.exists, 'Policy document does not exist');
    verify(locationSnap, 'Location document does not exist');

    const meta = { metadata: { updated: Timestamp.now() } };

    const newLocationData = deepmerge(locationSnap.data(), {
      ...locationChanges,
      ...meta,
    }) as Partial<ILocation>;

    const newPolicyData = deepmerge(
      policySnap.data(),
      {
        ...policyChanges,
        ...meta,
      },
      {
        locations: {
          [locationId]: {
            lcnDocId: newLocationRef.id,
          },
        },
      }
    ) as Partial<PolicyNew>;

    await transaction.set(newLocationRef, newLocationData);
    await transaction.set(policyRef, newPolicyData, { merge: true });

    return { newLocationData, newPolicyData };
  });
};
