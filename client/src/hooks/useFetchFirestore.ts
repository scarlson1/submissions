import { Query, QueryConstraint, collection, getDocs, query } from 'firebase/firestore';
import { useCallback, useMemo, useState } from 'react';
import { useFirestore } from 'reactfire';

import { RatingData, TCollection, WithId } from 'common';

// TODO: fix - not working

export const useFetchFirestore = <T = RatingData>(
  collectionName: TCollection,
  constraints: QueryConstraint[]
) => {
  const firestore = useFirestore();
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [loading, setLoading] = useState(false);
  const collRef = useMemo(() => collection(firestore, collectionName), [firestore, collectionName]);

  const fetchData = useCallback(
    async (fetchConstraints: QueryConstraint[] = []) => {
      try {
        setLoading(true);

        const q = query(collRef, ...constraints, ...fetchConstraints) as Query<T>;

        const querySnap = await getDocs(q);

        let docs: WithId<T>[] = [];
        if (!querySnap.empty) docs = querySnap.docs.map((s) => ({ ...s.data(), id: s.id }));

        setData([...docs]);
        setLoading(false);
        return docs;
      } catch (err) {
        setLoading(false);
        return null;
      }
    },
    [collRef, constraints]
  );

  return useMemo(() => ({ fetchData, loading, data }), [fetchData, loading, data]);
};
