import { doc, DocumentReference } from 'firebase/firestore';
import { ReactFireOptions, useFirestore, useFirestoreDocData } from 'reactfire';

import { COLLECTIONS } from 'common';

// TODO: change how path segments is passed to useDocData
// not intuitive passing docID second (before pathSegments)

export const useDocData = <T = any>(
  colName: keyof typeof COLLECTIONS,
  id: string,
  pathSegments: string[] = [],
  options?: ReactFireOptions<T> | undefined
) => {
  const firestore = useFirestore();
  const docRef = doc(firestore, COLLECTIONS[colName], ...pathSegments, id) as DocumentReference<T>;

  return useFirestoreDocData(docRef, options);
};
