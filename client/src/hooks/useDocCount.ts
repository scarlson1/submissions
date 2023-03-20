import { useCallback } from 'react';
import {
  collection,
  query,
  where,
  getCountFromServer,
  // QueryFieldFilterConstraint,
  WhereFilterOp,
  QueryConstraint,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';

import { COLLECTIONS } from 'common';

export function mapWhereConstraints(constraints: QueryArgs[]) {
  return constraints.map((c) => where(c[0], c[1], c[2]));
}

type QueryArgs = [string, WhereFilterOp, any];

export function useDocCount(
  collName: keyof typeof COLLECTIONS,
  constraints: QueryConstraint[] = []
) {
  const db = useFirestore();

  return useCallback(() => {
    const collectionRef = collection(db, COLLECTIONS[collName]);

    return getCountFromServer(query(collectionRef, ...constraints));
  }, [db, constraints, collName]);
}

// export function mapWhereConstraints(constraints: QueryArgs[]) {
//   return constraints.map((c) => where(c[0], c[1], c[2]));
// }

// type QueryArgs = [string, WhereFilterOp, any];

// export function useDocCount(collName: keyof typeof COLLECTIONS, constraints?: QueryArgs[]) {
//   const db = useFirestore();
//   const qConstraints = useMemo<QueryFieldFilterConstraint[]>(
//     () => (constraints ? mapWhereConstraints(constraints) : []), // where('userId', '==', user?.uid)
//     [constraints]
//   );

//   return useCallback(() => {
//     const collectionRef = collection(db, COLLECTIONS[collName]);

//     return getCountFromServer(query(collectionRef, ...qConstraints));
//   }, [db, qConstraints, collName]);
// }
