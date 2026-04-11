import type { TCollection } from '@idemand/common';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  collection,
  CollectionReference,
  DocumentData,
  getDocs,
  limit,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  startAfter,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';

export const useInfiniteDocs = <T extends DocumentData>(
  colName: TCollection, // string,
  constraints: QueryConstraint[],
  pageSize: number = 4,
  pathSegments: string[] = [],
  // queryOptions: Omit<
  //   UseInfiniteQueryOptions,
  //   'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
  // >
) => {
  const firestore = useFirestore();

  const colRef = collection(
    firestore,
    colName,
    ...pathSegments,
  ) as CollectionReference<T, T>;

  const fetchDocs = async ({
    pageParam: cursor,
  }: {
    pageParam: QueryDocumentSnapshot<T> | null;
  }) => {
    const cursorConstraint = cursor ? [startAfter(cursor)] : [];
    const q = query<T, T>(
      colRef,
      ...constraints,
      ...cursorConstraint,
      limit(pageSize),
    );

    let snaps = await getDocs(q);

    const newData = snaps.docs.map((snap) => ({ ...snap.data(), id: snap.id }));
    const nextCursor = snaps.docs[snaps.docs.length - 1]; // TODO: next cursor undefined if doc count === total doc count ?? or wait for next call to return undefined
    // logDev('infinite fetch Docs: ', newData);
    return { data: newData, nextCursor };
  };

  // TODO: query key factory
  return useInfiniteQuery({
    queryKey: [`infinite-${colName}`, { constraints }, ...pathSegments],
    queryFn: fetchDocs,
    initialPageParam: null,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
    staleTime: 30000,
    gcTime: 600000, // 10 mins
    // ...(queryOptions || {}),
  });
};
