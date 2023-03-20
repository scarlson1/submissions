import { doc, DocumentReference } from 'firebase/firestore';
import { useFirestore, useFirestoreDocData } from 'reactfire';

import { COLLECTIONS } from 'common';

export const useDocData = <T = any>(collName: keyof typeof COLLECTIONS, id: string) => {
  const firestore = useFirestore();
  const docRef = doc(firestore, COLLECTIONS[collName], id) as DocumentReference<T>;

  return useFirestoreDocData(docRef);
};
