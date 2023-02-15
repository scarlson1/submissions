import { useCallback, useMemo } from 'react';
import {
  collection,
  query,
  getFirestore,
  where,
  getCountFromServer,
  QueryFieldFilterConstraint,
  WhereFilterOp,
} from 'firebase/firestore';

import { useAuth } from 'modules/components/AuthContext';

export function mapWhereConstraints(constraints: QueryArgs[]) {
  return constraints.map((c) => where(c[0], c[1], c[2]));
}

type QueryArgs = [string, WhereFilterOp, any];

export function useDocCount(collectionName: string, constraints?: QueryArgs[]) {
  const db = getFirestore();
  const { user } = useAuth();
  const qConstraints = useMemo<QueryFieldFilterConstraint[]>(
    () => (constraints ? mapWhereConstraints(constraints) : [where('userId', '==', user?.uid)]),
    [constraints, user]
  );

  return useCallback(() => {
    // const qConstraints: QueryFieldFilterConstraint[] = constraints
    //   ? getWhereConstraints(constraints)
    //   : [where('userId', '==', user?.uid)];

    const collectionRef = collection(db, collectionName);

    return getCountFromServer(query(collectionRef, ...qConstraints));
  }, [db, qConstraints, collectionName]);
}
