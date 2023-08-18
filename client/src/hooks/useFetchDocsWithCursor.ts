import {
  collection,
  collectionGroup,
  CollectionReference,
  DocumentSnapshot,
  limit,
  query,
  QueryConstraint,
  startAfter,
} from 'firebase/firestore';
import { useMemo } from 'react';
import { ReactFireOptions, useFirestore, useFirestoreCollection } from 'reactfire';

import { COLLECTIONS } from 'common';

export function useFetchDocsWithCursor<T = any>(
  collName: keyof typeof COLLECTIONS,
  constraints: QueryConstraint[],
  params: { cursor?: DocumentSnapshot; itemsPerPage: number },
  isCollectionGroup: boolean = false,
  pathSegments: string[] = [],
  options?: ReactFireOptions<T[]> | undefined
) {
  const db = useFirestore();

  const qConstraints: QueryConstraint[] = useMemo(
    () => [...constraints, limit(params.itemsPerPage)],
    [constraints, params?.itemsPerPage]
  );

  if (params.cursor) {
    qConstraints.push(startAfter(params.cursor));
  }

  let collectionRef;
  // allow for collection group queries
  if (!!isCollectionGroup) {
    collectionRef = collectionGroup(db, COLLECTIONS[collName]) as CollectionReference<T>;
  } else {
    collectionRef = collection(
      db,
      COLLECTIONS[collName],
      ...pathSegments
    ) as CollectionReference<T>;
  }

  let q = query(collectionRef, ...qConstraints);

  return useFirestoreCollection<T>(q, { idField: 'id', ...options });
}
