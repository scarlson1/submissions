import { DocumentReference, doc } from 'firebase/firestore';
import { ReactFireOptions, useFirestore, useFirestoreDocDataOnce } from 'reactfire';

import { COLLECTIONS } from 'common';

export const useDocDataOnce = <T = any>(
  colName: keyof typeof COLLECTIONS,
  id: string,
  options: ReactFireOptions<T> = {},
  pathSegments: string[] = []
) => {
  const firestore = useFirestore();
  const docRef = doc(firestore, COLLECTIONS[colName], ...pathSegments, id) as DocumentReference<T>;

  return useFirestoreDocDataOnce(docRef, options);
};
