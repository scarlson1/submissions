import { Timestamp, addDoc, collection, getFirestore } from 'firebase/firestore';

import { COLLECTIONS } from 'common';
import { createResource } from 'modules/utils';

function createDraftChangeRequest(policyId: string) {
  return addDoc(
    collection(getFirestore(), COLLECTIONS.POLICIES, policyId, COLLECTIONS.CHANGE_REQUESTS),
    {
      status: 'draft',
      policyId,
      metadata: {
        created: Timestamp.now(),
        updated: Timestamp.now(),
      },
    }
  );
}

export function createChangeRequest(policyId: string) {
  return createResource(createDraftChangeRequest(policyId));
}
