import {
  addDoc,
  CollectionReference,
  DocumentReference,
  getFirestore,
  Timestamp,
} from 'firebase/firestore';

import type { DraftPolicyClaim } from '@idemand/common';
import {
  BaseChangeRequest,
  ChangeRequest,
  changeRequestsCollection,
  policyClaimsCollection,
} from 'common';
import { createResource } from 'modules/utils';

// TODO: omit values from initialValues prop type
// BUG: security rules using doc owner instead of policy owner & not setting user/agent Id on create draft
function createDraftChangeRequest<T extends BaseChangeRequest = ChangeRequest>(
  policyId: string,
  initialValues?: Partial<T>,
): Promise<DocumentReference<Partial<T>>> {
  const colRef = changeRequestsCollection(
    getFirestore(),
    policyId,
  ) as CollectionReference<Partial<T>>;

  const initialData = {
    status: 'draft',
    policyId,
    ...(initialValues || {}),
    metadata: {
      created: Timestamp.now(),
      updated: Timestamp.now(),
    },
  } as unknown as Partial<T>;

  // @ts-ignore TODO: fix type - don't use generic ?? or also use generic for colRef
  return addDoc<Partial<T>, Partial<T>>(colRef, initialData);
}

export function createChangeRequest<
  T extends BaseChangeRequest = ChangeRequest,
>(policyId: string, initialValues?: Partial<T>) {
  return createResource<DocumentReference<Partial<T>>>(
    createDraftChangeRequest<T>(policyId, initialValues),
  );
}

function createDraftClaim(
  policyId: string,
  locationId: string,
  initialValues: Partial<DraftPolicyClaim> = {},
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

  return addDoc<Partial<DraftPolicyClaim>, Partial<DraftPolicyClaim>>(
    colRef,
    initialData,
  );
}

export function createClaim(
  policyId: string,
  locationId: string,
  initialValues: Partial<DraftPolicyClaim> = {},
) {
  return createResource(createDraftClaim(policyId, locationId, initialValues));
}

// TODO: make generic function --> pass in collection ref and <T>
// or create factory function ??
