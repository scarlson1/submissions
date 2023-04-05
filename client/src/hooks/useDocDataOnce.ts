import { ReactFireOptions, useFirestore, useFirestoreDocDataOnce } from 'reactfire';
import { doc, DocumentReference } from 'firebase/firestore';

import { COLLECTIONS } from 'common';

export const useDocDataOnce = <T = any>(
  collName: keyof typeof COLLECTIONS,
  id: string,
  options: ReactFireOptions<T> = {},
  pathSegments: string[] = []
) => {
  const firestore = useFirestore();
  const docRef = doc(firestore, COLLECTIONS[collName], ...pathSegments, id) as DocumentReference<T>;

  return useFirestoreDocDataOnce(docRef, options);
};
