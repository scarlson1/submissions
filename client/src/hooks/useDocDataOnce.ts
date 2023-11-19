import { DocumentReference, doc } from 'firebase/firestore';
import { useFirestore, useFirestoreDocDataOnce } from 'reactfire';

import { TCollection } from 'common';

export const useDocDataOnce = <T = any>(
  colName: TCollection,
  id: string,
  // options: ReactFireOptions<T> = {},
  ...pathSegments: string[]
) => {
  const firestore = useFirestore();
  const docRef = doc(firestore, colName, id, ...pathSegments) as DocumentReference<T>;

  return useFirestoreDocDataOnce(docRef); // options
};
