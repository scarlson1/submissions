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

import { TCollection } from 'common';

export function useFetchDocsWithCursor<T = any>(
  colName: TCollection,
  constraints: QueryConstraint[],
  params: { cursor?: DocumentSnapshot; itemsPerPage: number },
  isCollectionGroup: boolean = false,
  pathSegments: string[] = [],
  options?: ReactFireOptions<T[]> | undefined
) {
  const db = useFirestore();

  const qConstraints: QueryConstraint[] = useMemo(() => {
    let c = [...constraints, limit(params.itemsPerPage)];
    if (params.cursor) c.push(startAfter(params.cursor));
    return c;
  }, [constraints, params]);

  let collectionRef;
  if (!!isCollectionGroup) {
    collectionRef = collectionGroup(db, colName) as CollectionReference<T>;
  } else {
    collectionRef = collection(db, colName, ...pathSegments) as CollectionReference<T>;
  }

  let q = query(collectionRef, ...qConstraints);

  // useEffect(() => {
  //   console.log('QUERY: ', q);
  // }, [q]);

  return useFirestoreCollection<T>(q, { idField: 'id', ...options });
}
