import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SetOptions,
  Timestamp,
} from 'firebase-admin/firestore';

import { Policy, PolicyClass } from '../types';

// https://firebase.google.com/docs/reference/node/firebase.firestore.FirestoreDataConverter

// DOCS: "To use set() with merge and mergeFields, toFirestore() must be defined with Partial<T>"

// "updateDoc()" DOES NOT TRIGGER CONVERTER
// "On the other side, update() is used to update the fields, where the fields can sit inside the nested data structure in Document and are not necessary partial T. So it will not trigger converter."

export const policyConverter: FirestoreDataConverter<Policy> = {
  // toFirestore(policy: PolicyClass): DocumentData {
  toFirestore(policy: Partial<PolicyClass>, options?: SetOptions): DocumentData {
    // let firebaseFields = policy
    return {
      ...policy, // TODO: explicitly pull values off (class has methods, extra values, etc.)
      'metadata.updated': Timestamp.now(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<Policy>): PolicyClass {
    const data = snapshot.data();
    return new PolicyClass({ ...data, id: snapshot.id });
  },
};
