import {
  DocumentData,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  WithFieldValue,
} from 'firebase/firestore';

import { Policy, WithId } from 'common';
import { calcPolicyStatus } from 'modules/utils';

export const policyConverter = {
  toFirestore(policy: PartialWithFieldValue<Policy> | WithFieldValue<Policy>): DocumentData {
    return { ...policy, 'metadata.updated': Timestamp.now() };
  },
  fromFirestore(snap: QueryDocumentSnapshot<Policy>, options: SnapshotOptions): WithId<Policy> {
    // TODO: return class ??
    const data = snap.data(options);
    const status = calcPolicyStatus(data);

    // @ts-ignore TODO: update policy status to new interface
    return { ...data, status, id: snap.id };
  },
};
