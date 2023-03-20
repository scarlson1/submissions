import {
  collection,
  CollectionReference,
  DocumentData,
  query,
  QueryConstraint,
} from 'firebase/firestore';
import { useFirestore, useFirestoreCollectionData } from 'reactfire';

import { COLLECTIONS, WithId } from 'common';

export const useCollectionData = <T = DocumentData>(
  collName: keyof typeof COLLECTIONS,
  constraints: QueryConstraint[] = []
) => {
  const firestore = useFirestore();
  const collRef = collection(firestore, COLLECTIONS[collName]) as CollectionReference<WithId<T>>;
  const q = query(collRef, ...constraints);

  return useFirestoreCollectionData<WithId<T>>(q, {
    idField: 'id',
  });
};
