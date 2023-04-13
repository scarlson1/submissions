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
import { useFirestore, useFirestoreCollection } from 'reactfire';

import { COLLECTIONS } from 'common';

export function useFetchDocsWithCursor<T = any>(
  collName: keyof typeof COLLECTIONS,
  constraints: QueryConstraint[],
  params: { cursor?: DocumentSnapshot; itemsPerPage: number },
  isCollectionGroup: boolean = false,
  pathSegments: string[] = []
) {
  const db = useFirestore();

  const qConstraints: QueryConstraint[] = [...constraints, limit(params.itemsPerPage)];
  if (params.cursor) {
    qConstraints.push(startAfter(params.cursor));
  }

  let collectionRef;
  if (!!isCollectionGroup) {
    console.log('USING COLLECTION GROUP QUERY');
    collectionRef = collectionGroup(db, COLLECTIONS[collName]) as CollectionReference<T>;
  } else {
    console.log('NOT USING COLLECTION GROUP QUERY');
    collectionRef = collection(
      db,
      COLLECTIONS[collName],
      ...pathSegments
    ) as CollectionReference<T>;
  }

  const q = query(collectionRef, ...qConstraints);

  return useFirestoreCollection<T>(q, { idField: 'id' });
}
