import {
  collection,
  CollectionReference,
  DocumentData,
  query,
  QueryConstraint,
} from 'firebase/firestore';
import { ReactFireOptions, useFirestore, useFirestoreCollectionData } from 'reactfire';

import { COLLECTIONS, WithId } from 'common';

export const useCollectionData = <T = DocumentData>(
  collName: keyof typeof COLLECTIONS, // TODO: better typing - able to check if part of enum?
  constraints: QueryConstraint[] = [],
  options: ReactFireOptions<T> | undefined = {},
  pathSegments: string[] = []
) => {
  const firestore = useFirestore();

  const collRef = collection(
    firestore,
    COLLECTIONS[collName],
    ...pathSegments
  ) as CollectionReference<WithId<T>>;

  const q = query(collRef, ...constraints);

  return useFirestoreCollectionData<WithId<T>>(q, {
    idField: 'id',
    ...options,
  });
};
