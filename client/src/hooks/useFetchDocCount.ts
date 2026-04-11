import type { TCollection } from '@idemand/common';
import {
  collection,
  collectionGroup,
  getCountFromServer,
  query,
  QueryConstraint,
} from 'firebase/firestore';
import { useCallback } from 'react';
import { useFirestore } from 'reactfire';

export function useFetchDocCount(
  colName: TCollection,
  constraints: QueryConstraint[] = [],
  isCollectionGroup: boolean = false,
  pathSegments: string[] = [],
) {
  const db = useFirestore();

  return useCallback(() => {
    let path = colName;
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
