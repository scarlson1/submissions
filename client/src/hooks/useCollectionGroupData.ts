import {
  collectionGroup,
  CollectionReference,
  DocumentData,
  query,
  QueryConstraint,
} from 'firebase/firestore';
import {
  ReactFireOptions,
  useFirestore,
  useFirestoreCollectionData,
} from 'reactfire';

import type { WithId } from '@idemand/common';
import { TCollection } from 'common';

export const useCollectionGroupData = <T = DocumentData>(
  colName: TCollection,
  constraints: QueryConstraint[] = [],
  options: ReactFireOptions<T> | undefined = {},
) => {
  const firestore = useFirestore();
  const collGroupRef = collectionGroup(
    firestore,
    colName,
  ) as CollectionReference<WithId<T>>;
  const q = query(collGroupRef, ...constraints);

  return useFirestoreCollectionData<WithId<T>>(q, {
    idField: 'id',
    ...options,
  });
};
