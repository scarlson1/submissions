import {
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  WithFieldValue,
} from 'firebase/firestore';

import type { Policy, WithId } from '@idemand/common';
import { calcPolicyStatus } from 'modules/utils';

export interface PolicyWithStatus extends Policy {
  status?: string | null;
}

// docs: https://firebase.google.com/docs/reference/js/firestore_.firestoredataconverter

export const policyConverter = {
  toFirestore(
    policy: PartialWithFieldValue<Policy> | WithFieldValue<Policy>,
  ): Policy {
    return {
      ...(policy as Policy),
      metadata: {
        ...(policy.metadata as Policy['metadata']),
        updated: Timestamp.now(),
      },
    };
  },
  fromFirestore(
    snap: QueryDocumentSnapshot<Policy>,
    options: SnapshotOptions,
  ): WithId<PolicyWithStatus> {
    // TODO: return class ??
    const data = snap.data(options);
    const status = calcPolicyStatus(data);
    console.log('STATUS: ', status);

    return { ...data, status, id: snap.id };
  },
};
