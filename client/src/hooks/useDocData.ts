import { doc, DocumentReference } from 'firebase/firestore';
import { useFirestore, useFirestoreDocData } from 'reactfire';

import type { WithId } from '@idemand/common';
import { TCollection } from 'common';

export const useDocData = <T = any>(
  colName: TCollection,
  id: string,
  // pathSegments: string[] = [],
  // options?: ReactFireOptions<T> | undefined,
  ...pathSegments: string[]
) => {
  const firestore = useFirestore();
  const docRef = doc(
    firestore,
    colName,
    id,
    ...pathSegments,
  ) as DocumentReference<WithId<T>>;

  return useFirestoreDocData(docRef, { idField: 'id' });
};
