import { useCallback } from 'react';
import {
  collection,
  query,
  where,
  getCountFromServer,
  WhereFilterOp,
  QueryConstraint,
  collectionGroup,
} from 'firebase/firestore';
import { useFirestore } from 'reactfire';

import { COLLECTIONS } from 'common';

export function mapWhereConstraints(constraints: QueryArgs[]) {
  return constraints.map((c) => where(c[0], c[1], c[2]));
}

type QueryArgs = [string, WhereFilterOp, any];

export function useFetchDocCount(
  colName: keyof typeof COLLECTIONS,
  constraints: QueryConstraint[] = [],
  isCollectionGroup: boolean = false,
  pathSegments: string[] = []
) {
  const db = useFirestore();

  return useCallback(() => {
    // const collectionRef = collection(db, COLLECTIONS[collName]);
    let path = COLLECTIONS[colName] as string;
    if (pathSegments.length) path += `/${pathSegments.join('/')}`;

    let colRef;
    if (!!isCollectionGroup) {
      colRef = collectionGroup(db, path);
    } else {
      colRef = collection(db, path);
    }
    const filteredConstraints = constraints.filter((c) => c.type === 'where');

    return getCountFromServer(query(colRef, ...filteredConstraints));
  }, [db, constraints, colName, isCollectionGroup, pathSegments]);
}
