import { useCallback, useMemo, useState } from 'react';
import { collection, getDocs, Query, query, QueryConstraint } from 'firebase/firestore';
import { useFirestore } from 'reactfire';

import { RatingData, WithId } from 'common';

// TODO: fix - not working

export const useFetchFirestore = <T = RatingData>(
  collectionName: string,
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
