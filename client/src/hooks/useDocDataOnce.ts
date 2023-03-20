import { useFirestore, useFirestoreDocDataOnce } from 'reactfire';
import { doc, DocumentReference } from 'firebase/firestore';

import { COLLECTIONS } from 'common';

export const useDocDataOnce = <T = any>(collName: keyof typeof COLLECTIONS, id: string) => {
  const firestore = useFirestore();
  const docRef = doc(firestore, COLLECTIONS[collName], id) as DocumentReference<T>;

  return useFirestoreDocDataOnce(docRef);
};
