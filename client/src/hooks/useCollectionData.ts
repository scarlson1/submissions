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
  colName: keyof typeof COLLECTIONS, // TODO: better typing - able to check if part of enum?
  constraints: QueryConstraint[] = [],
  options: ReactFireOptions<T> | undefined = {},
  pathSegments: string[] = []
) => {
  const firestore = useFirestore();

  const colRef = collection(
    firestore,
    COLLECTIONS[colName],
    ...pathSegments
  ) as CollectionReference<WithId<T>>;

  const q = query(colRef, ...constraints);

  return useFirestoreCollectionData<WithId<T>>(q, {
    idField: 'id',
    ...options,
  });
};
