import type { TCollection } from '@idemand/common';
import {
  collection,
  collectionGroup,
  CollectionReference,
  DocumentData,
  DocumentSnapshot,
  FirestoreDataConverter,
  limit,
  query,
  QueryConstraint,
  startAfter,
  type Query,
} from 'firebase/firestore';
import { useMemo } from 'react';
import {
  ReactFireOptions,
  useFirestore,
  useFirestoreCollection,
} from 'reactfire';

export function useFetchDocsWithCursor<
  T extends DocumentData = DocumentData,
  D extends DocumentData = T,
>(
  colName: TCollection,
  constraints: QueryConstraint[],
  params: { cursor?: DocumentSnapshot; itemsPerPage: number },
  isCollectionGroup: boolean = false,
  pathSegments: string[] = [],
  options?: ReactFireOptions<T[]> | undefined,
  converter?: FirestoreDataConverter<T, D>,
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
    collectionRef = collection(
      db,
      colName,
      ...pathSegments,
    ) as CollectionReference<T>;
  }
  if (converter) collectionRef.withConverter(converter);

  let q: Query<T, DocumentData> = query(collectionRef, ...qConstraints);

  // useEffect(() => {
  //   console.log('QUERY: ', q);
  // }, [q]);

  return useFirestoreCollection<T>(q, { idField: 'id', ...options });
}
