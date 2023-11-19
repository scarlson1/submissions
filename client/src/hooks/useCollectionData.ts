import {
  collection,
  CollectionReference,
  DocumentData,
  query,
  QueryConstraint,
} from 'firebase/firestore';
import { ReactFireOptions, useFirestore, useFirestoreCollectionData } from 'reactfire';

import { TCollection, WithId } from 'common';

// TODO: use ...pathSegments ??

export const useCollectionData = <T = DocumentData>(
  colName: TCollection,
  constraints: QueryConstraint[] = [],
  options: ReactFireOptions<T> | undefined = {},
  pathSegments: string[] = []
) => {
  const firestore = useFirestore();

  const colRef = collection(firestore, colName, ...pathSegments) as CollectionReference<WithId<T>>;

  const q = query(colRef, ...constraints);

  return useFirestoreCollectionData<WithId<T>>(q, {
    idField: 'id',
    ...options,
  });
};
