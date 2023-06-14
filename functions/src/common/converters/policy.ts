import {
  DocumentData,
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SetOptions,
  Timestamp,
} from 'firebase-admin/firestore';

import { Policy as IPolicy, PolicyClass } from '../types';

// https://firebase.google.com/docs/reference/node/firebase.firestore.FirestoreDataConverter

// DOCS: "To use set() with merge and mergeFields, toFirestore() must be defined with Partial<T>"

// "updateDoc()" DOES NOT TRIGGER CONVERTER
// "On the other side, update() is used to update the fields, where the fields can sit inside the nested data structure in Document and are not necessary partial T. So it will not trigger converter."

// transactions: https://stackoverflow.com/a/66105253/10887890

export const policyConverter: FirestoreDataConverter<IPolicy> = {
  // toFirestore(policy: PolicyClass): DocumentData {
  toFirestore(policy: Partial<PolicyClass>, options?: SetOptions): DocumentData {
    console.log('TO FIRESTORE POLICY PROPS: ', JSON.stringify(policy, null, 2));

    return {
      ...policy,
      // TODO: explicitly pull values off (class has methods, extra values, etc.)
      product: policy.product,
      status: policy.status,
      // limits: policy.limits,
      // deductible: policy.deductible,
      mailingAddress: policy.mailingAddress,
      homestate: policy.homeState,
      namedInsured: policy.namedInsured,
      locations: policy.locations,
      effectiveDate: policy.effectiveDate,
      expirationDate: policy.expirationDate,
      userId: policy.userId,
      agent: policy.agent,
      agency: policy.agency,
      issuingCarrier: policy.issuingCarrier,
      price: policy.price,
      // cardFee: policy.cardFee, // TODO: calc in billing (could be add location, etc.)
      imageURLs: policy.imageURLs,
      imagePaths: policy.imagePaths,
      'metadata.updated': Timestamp.now(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot<IPolicy>): PolicyClass {
    const data = snapshot.data();
    return new PolicyClass({ ...data, id: snapshot.id });
  },
};
