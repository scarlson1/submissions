import type { TCollection } from '@idemand/common';
import { doc, DocumentReference } from 'firebase/firestore';
import { useFirestore, useFirestoreDocDataOnce } from 'reactfire';

export const useDocDataOnce = <T = any>(
  colName: TCollection,
  id: string,
  // options: ReactFireOptions<T> = {},
  ...pathSegments: string[]
) => {
  const firestore = useFirestore();
  const docRef = doc(
    firestore,
    colName,
    id,
    ...pathSegments,
  ) as DocumentReference<T>;

  return useFirestoreDocDataOnce(docRef); // options
};
