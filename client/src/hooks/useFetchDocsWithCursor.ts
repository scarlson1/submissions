import {
  collection,
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
  params: { cursor?: DocumentSnapshot; itemsPerPage: number }
) {
  const db = useFirestore();

  const qConstraints: QueryConstraint[] = [...constraints, limit(params.itemsPerPage)];
  if (params.cursor) {
    qConstraints.push(startAfter(params.cursor));
  }

  const collectionRef = collection(db, COLLECTIONS[collName]) as CollectionReference<T>;
  const q = query(collectionRef, ...qConstraints);

  return useFirestoreCollection<T>(q, { idField: 'id' });
}
