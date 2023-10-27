import { doc, DocumentReference } from 'firebase/firestore';
import { useFirestore, useFirestoreDocData } from 'reactfire';

import { COLLECTIONS } from 'common';

export const useDocData = <T = any>(
  colName: keyof typeof COLLECTIONS,
  id: string,
  // pathSegments: string[] = [],
  // options?: ReactFireOptions<T> | undefined,
  ...pathSegments: string[]
) => {
  const firestore = useFirestore();
  // const docRef = doc(firestore, COLLECTIONS[colName], ...pathSegments, id) as DocumentReference<T>;
  const docRef = doc(firestore, COLLECTIONS[colName], id, ...pathSegments) as DocumentReference<T>;

  return useFirestoreDocData(docRef, { idField: 'id' });
};
