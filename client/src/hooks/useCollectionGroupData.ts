import {
  collectionGroup,
  CollectionReference,
  DocumentData,
  query,
  QueryConstraint,
} from 'firebase/firestore';
import { ReactFireOptions, useFirestore, useFirestoreCollectionData } from 'reactfire';

import { COLLECTIONS, WithId } from 'common';

export const useCollectionGroupData = <T = DocumentData>(
  colName: keyof typeof COLLECTIONS,
  constraints: QueryConstraint[] = [],
  options: ReactFireOptions<T> | undefined = {}
) => {
  const firestore = useFirestore();
  const collGroupRef = collectionGroup(firestore, COLLECTIONS[colName]) as CollectionReference<
    WithId<T>
  >;
  const q = query(collGroupRef, ...constraints);

  return useFirestoreCollectionData<WithId<T>>(q, {
    idField: 'id',
    ...options,
  });
};
