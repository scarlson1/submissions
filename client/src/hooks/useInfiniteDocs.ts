import { useInfiniteQuery } from '@tanstack/react-query';
import {
  CollectionReference,
  QueryConstraint,
  collection,
  getDocs,
  limit,
  query,
  startAfter,
} from 'firebase/firestore';
import { logDev } from 'modules/utils';
import { useFirestore } from 'reactfire';

export const useInfiniteDocs = <T>(
  colName: string,
  constraints: QueryConstraint[],
  pageSize: number = 4,
  pathSegments: string[] = []
) => {
  const firestore = useFirestore();

  const colRef = collection(firestore, colName, ...pathSegments) as CollectionReference<T>;

  const fetchDocs = async ({ pageParam: cursor = null }) => {
    const cursorConstraint = cursor ? [startAfter(cursor)] : [];
    const q = query<T>(colRef, ...constraints, ...cursorConstraint, limit(pageSize));

    let snaps = await getDocs(q);

    const newData = snaps.docs.map((snap) => ({ ...snap.data(), id: snap.id }));
    const nextCursor = snaps.docs[snaps.docs.length - 1]; // TODO: next cursor undefined if doc count === total doc count ?? or wait for next call to return undefined
    logDev('locations: ', newData);
    return { data: newData, nextCursor };
  };

  return useInfiniteQuery({
    queryKey: [`infinite-${colName}`, { constraints }, ...pathSegments],
    queryFn: fetchDocs,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  });
};
