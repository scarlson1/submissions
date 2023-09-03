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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useFirestore } from 'reactfire';

import { COLLECTIONS, ILocation, WithId } from 'common';
import { useDocData, useFetchDocCount } from 'hooks';
import { LocationCard, LocationCardProps } from './LocationCard';

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
  const initialFetched = useRef(false);

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

  useEffect(() => {
    console.log('initial getRecords');
    if (initialFetched.current) return;
    initialFetched.current = true;
    console.log('useEffect --> calling getRecords');
    getRecords();
  }, [getRecords]);

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

  return (
    <Grid container rowSpacing={4} columnSpacing={6}>
      {locations.map((l: WithId<ILocation>) => (
        <Grid xs={12} sm={6} md={4} xl={3} key={l.id}>
          <LocationCard location={l} namedInsured={policy.namedInsured} {...props} />
        </Grid>
      ))}
      <Grid xs={12}>
        {locations.length < docCount ? <Button onClick={loadMore}>Load more</Button> : null}

        {/* <Typography variant='subtitle2'>{`status: ${status}`}</Typography> */}
      </Grid>
    </Grid>
  );
};
