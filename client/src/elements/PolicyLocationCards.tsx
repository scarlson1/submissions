import { Button, Unstable_Grid2 as Grid } from '@mui/material';
import {
  CollectionReference,
  DocumentReference,
  DocumentSnapshot,
  QueryConstraint,
  collection,
  getDocs,
  limit,
  query,
  startAfter,
  where,
} from 'firebase/firestore';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useFirestore } from 'reactfire';

import { useInfiniteQuery } from '@tanstack/react-query';
import { COLLECTIONS, ILocation, WithId } from 'common';
import { useDocData, useFetchDocCount } from 'hooks';
import { useFirstRender } from 'hooks/utils';
import { LocationCard, LocationCardProps } from './LocationCard';

// TODO: use react-query ??

const useInfiniteDocs = <T,>(
  colName: keyof typeof COLLECTIONS,
  constraints: QueryConstraint[],
  pageSize: number = 4,
  pathSegments: string[] = []
): any => {
  const firestore = useFirestore();
  const [docCount, setDocCount] = useState(0);
  const [data, setData] = useState<WithId<T>[]>([]);
  const [loading, setLoading] = useState(false);
  const lastSnap = useRef<DocumentSnapshot<T>>();

  const colRef = collection(
    firestore,
    COLLECTIONS[colName],
    ...pathSegments
  ) as CollectionReference<T>;

  const fetchCount = useFetchDocCount('LOCATIONS', constraints, false, pathSegments);

  useEffect(() => {
    fetchCount().then((result) => setDocCount(result.data().count));
  }, [fetchCount, constraints]);

  const getRecords = useCallback(async () => {
    try {
      console.log('get records called');
      if (docCount && data.length >= docCount) {
        toast('no more data');
        return;
      }
      setLoading(true);
      const cursorConstraint = lastSnap.current ? [startAfter(lastSnap.current)] : [];
      const q = query<T>(colRef, ...constraints, ...cursorConstraint, limit(pageSize));

      let snaps = await getDocs(q);
      lastSnap.current = snaps.docs[snaps.docs.length - 1];

      const newData = snaps.docs.map((snap) => ({ ...snap.data(), id: snap.id }));
      setData((prev) => [...prev, ...newData]);

      setLoading(false);
    } catch (err: any) {
      console.log('Error: ', err);
      setLoading(false);
    }
  }, [colRef, constraints, pageSize, data, docCount]);

  useFirstRender(() => getRecords());

  return useMemo(
    () => ({ data, docCount, loadMore: getRecords, loading }),
    [data, docCount, getRecords, loading]
  );
};

interface PolicyLocationCardsProps extends Omit<LocationCardProps, 'location' | 'namedInsured'> {
  policyId: string;
  startingCursor?: DocumentReference;
  pageSize?: number;
}

// TODO: add sort / filter capabilities
// passed as props so same filters can be shared across cards/map ??

export const PolicyLocationCards = ({ policyId, pageSize, ...props }: PolicyLocationCardsProps) => {
  const { data: policy } = useDocData('POLICIES', policyId);
  const {
    data: locations,
    docCount,
    loadMore,
  } = useInfiniteDocs<ILocation>('LOCATIONS', [where('policyId', '==', policyId)], pageSize);

  // const blurLocation = useMemo(() => {
  //   if (!locations[0]) return null;
  //   return { ...(locations[0] || {}), imageUrls: locations[0].blurHash || {} };
  // }, [locations]);

  return (
    <Grid container rowSpacing={4} columnSpacing={6}>
      {locations.map((l: WithId<ILocation>) => (
        <Grid xs={12} sm={6} md={4} xl={3} key={l.id}>
          <LocationCard location={l} namedInsured={policy.namedInsured} {...props} />
        </Grid>
      ))}
      <Grid xs={12}>
        {locations.length < docCount ? <Button onClick={loadMore}>Load more</Button> : null}
      </Grid>
      {/* {blurLocation && (
        <Blurhash
          hash='LEHV6nWB2yk8pyo0adR*.7kCMdnj'
          width={400}
          height={300}
          resolutionX={32}
          resolutionY={32}
          punch={1}
        />
      )} */}
    </Grid>
  );
};

// const [page, setPage] = React.useState(0)

// const fetchProjects = (page = 0) => fetch('/api/projects?page=' + page).then((res) => res.json())

// const {
//   isLoading,
//   isError,
//   error,
//   data,
//   isFetching,
//   isPreviousData,
// } = useQuery({
//   queryKey: ['projects', page],
//   queryFn: () => fetchProjects(page),
//   keepPreviousData : true
// })

// const fetchProjects = async ({ pageParam = 0 }) => {
//   const res = await fetch('/api/projects?cursor=' + pageParam);
//   return res.json();
// };

// const { data, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, status } =
//   useInfiniteQuery({
//     queryKey: ['projects'],
//     queryFn: fetchProjects,
//     getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
//   });

const usePaginatedLocations = <T,>(
  // colName: keyof typeof COLLECTIONS,
  policyId: string,
  constraints: QueryConstraint[],
  pageSize: number = 4,
  pathSegments: string[] = []
) => {
  const firestore = useFirestore();
  // const lastSnap = useRef<DocumentSnapshot<T>>();
  // const [lastSnap, setLastSnap] = useState<DocumentSnapshot<T>>();
  const [docCount, setDocCount] = useState(0);
  // TODO: need to map page to last snap ??

  const colRef = collection(
    firestore,
    COLLECTIONS.LOCATIONS,
    // COLLECTIONS[colName],
    ...pathSegments
  ) as CollectionReference<T>;

  const fetchCount = useFetchDocCount('LOCATIONS', constraints, false, pathSegments);

  useEffect(() => {
    fetchCount().then((result) => setDocCount(result.data().count));
  }, [fetchCount, constraints]);

  // const fetchLocations = useCallback(
  //   async (lastSnap: any) => {
  // const cursorConstraint = lastSnap ? [startAfter(lastSnap)] : [];
  // const q = query<T>(colRef, ...constraints, ...cursorConstraint, limit(pageSize));

  // let snaps = await getDocs(q);
  // setLastSnap(snaps.docs[snaps.docs.length - 1]);

  // const newData = snaps.docs.map((snap) => ({ ...snap.data(), id: snap.id }));
  // return newData;
  //   },
  //   [colRef, constraints, pageSize]
  // );

  const fetchLocations = async ({ pageParam: cursor = null }) => {
    const cursorConstraint = cursor ? [startAfter(cursor)] : [];
    const q = query<T>(colRef, ...constraints, ...cursorConstraint, limit(pageSize));

    let snaps = await getDocs(q);
    // setLastSnap(snaps.docs[snaps.docs.length - 1]);

    const newData = snaps.docs.map((snap) => ({ ...snap.data(), id: snap.id }));
    const nextCursor = snaps.docs[snaps.docs.length - 1]; // TODO: next cursor undefined if doc count === total doc count
    return { data: newData, nextCursor };
    // const res = await fetch('/api/projects?cursor=' + pageParam)
  };

  // { data, error, fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, status }
  const rq = useInfiniteQuery({
    queryKey: ['locations', policyId],
    queryFn: fetchLocations,
    getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  });

  // const { isLoading, isError, error, data, isFetching, isPreviousData } = useQuery({
  //   queryKey: ['locations', policyId, lastSnap],
  //   queryFn: () => fetchLocations(lastSnap),
  //   keepPreviousData: true,
  //   initialData: [],
  //   suspense: false,
  // });

  return {
    ...rq,
    // data,
    // error,
    // isLoading,
    // isError,
    // isFetching,
    // isPreviousData,
    docCount,
    // hasMore: data.length < docCount,
  };
};

export const PolicyLocationCardsRQ = ({ policyId, ...props }: PolicyLocationCardsProps) => {
  const { data: policy } = useDocData('POLICIES', policyId);
  const {
    data,
    error,
    // isLoading,
    // isError,
    isFetching,
    // isPreviousData,
    docCount,
    // hasMore,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePaginatedLocations<ILocation>(policyId, [where('policyId', '==', policyId)]);

  return (
    <>
      <div>
        {/* <div>{`isLoading: ${isLoading}`}</div> */}
        <div>{`isFetching: ${isFetching}`}</div>
        {/* <div>{`isError: ${isError}`}</div> */}
        {/* <div>{`isPreviousData: ${isPreviousData}`}</div> */}
        <div>{`docCount: ${docCount}`}</div>
        {/* <div>{`hasMore: ${hasMore}`}</div> */}
      </div>
      <div>
        <Grid container rowSpacing={4} columnSpacing={6}>
          {data?.pages.map((group, i) => (
            <Fragment key={i}>
              {group.data.map((l) => (
                <Grid xs={12} sm={6} md={4} xl={3} key={l.id}>
                  <LocationCard location={l} namedInsured={policy.namedInsured} {...props} />
                </Grid>
                // <p key={location.id}>{location?.policyId}</p>
              ))}
            </Fragment>
          ))}
          {/* {locations.map((l) => (
            <Grid xs={12} sm={6} md={4} xl={3} key={l.id}>
              <LocationCard location={l} namedInsured={policy.namedInsured} {...props} />
            </Grid>
          ))} */}
        </Grid>
        <button onClick={() => fetchNextPage()} disabled={!hasNextPage || isFetchingNextPage}>
          {isFetchingNextPage
            ? 'Loading more...'
            : hasNextPage
            ? 'Load More'
            : 'Nothing more to load'}
        </button>
      </div>
      {Boolean(error) && (
        <div>
          <pre>{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}
    </>
  );
};
