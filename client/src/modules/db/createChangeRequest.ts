import {
  CollectionReference,
  DocumentReference,
  Timestamp,
  addDoc,
  getFirestore,
} from 'firebase/firestore';

import {
  BaseChangeRequest,
  ChangeRequest,
  DraftPolicyClaim,
  changeRequestsCollection,
  policyClaimsCollection,
} from 'common';
import { createResource } from 'modules/utils';

// TODO: omit values from initialValues prop type

function createDraftChangeRequest<T extends BaseChangeRequest = ChangeRequest>(
  policyId: string,
  initialValues?: Partial<T>
): Promise<DocumentReference<Partial<T>>> {
  const colRef = changeRequestsCollection(getFirestore(), policyId) as CollectionReference<
    Partial<T>
  >;

  const initialData = {
    status: 'draft',
    policyId,
    ...(initialValues || {}),
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  } as unknown as Partial<T>;

  return addDoc<Partial<T>>(colRef, initialData);
}

export function createChangeRequest<T extends BaseChangeRequest = ChangeRequest>(
  policyId: string,
  initialValues?: Partial<T>
) {
  return createResource<DocumentReference<Partial<T>>>(
    createDraftChangeRequest<T>(policyId, initialValues)
  );
}

function createDraftClaim(
  policyId: string,
  locationId: string,
  initialValues: Partial<DraftPolicyClaim> = {}
) {
  const colRef = policyClaimsCollection(getFirestore(), policyId);

  const initialData: Partial<DraftPolicyClaim> = {
    ...initialValues,
    policyId,
    locationId,
    status: 'draft',
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  };

  return addDoc<Partial<DraftPolicyClaim>>(colRef, initialData);
}

export function createClaim(
  policyId: string,
  locationId: string,
  initialValues: Partial<DraftPolicyClaim> = {}
) {
  return createResource(createDraftClaim(policyId, locationId, initialValues));
}

// TODO: make generic function --> pass in collection ref and <T>
// or create factory function ??
