import { useMemo } from 'react';
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

  // const qConstraints: QueryConstraint[] = [...constraints, limit(params.itemsPerPage)];
  const qConstraints: QueryConstraint[] = useMemo(
    () => [...constraints, limit(params.itemsPerPage)],
    [constraints, params?.itemsPerPage]
  );

  // console.log('CONSTRAINTS: ', constraints);

  if (params.cursor) {
    qConstraints.push(startAfter(params.cursor));
  }

  // useEffect(() => {
  //   console.log('Q CONSTRAINTS: ', qConstraints);
  // }, [qConstraints]);

  let collectionRef;
  // ALLOW FOR COLLECTION GROUP QUERIES
  if (!!isCollectionGroup) {
    collectionRef = collectionGroup(db, COLLECTIONS[collName]) as CollectionReference<T>;
  } else {
    collectionRef = collection(
      db,
      COLLECTIONS[collName],
      ...pathSegments
    ) as CollectionReference<T>;
  }

  const q = query(collectionRef, ...qConstraints);

  return useFirestoreCollection<T>(q, { idField: 'id', ...options });
}
