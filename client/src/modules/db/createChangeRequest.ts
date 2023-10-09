import {
  CollectionReference,
  DocumentReference,
  Timestamp,
  addDoc,
  getFirestore,
} from 'firebase/firestore';

import { BaseChangeRequest, ChangeRequest, changeRequestsCollection } from 'common';
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
