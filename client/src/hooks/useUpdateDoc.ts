import {
  doc,
  DocumentData,
  DocumentReference,
  Timestamp,
  UpdateData,
  updateDoc,
} from 'firebase/firestore';
import { useCallback, useMemo, useState } from 'react';
import { useFirestore } from 'reactfire';

import type { TCollection } from '@idemand/common';
import { createCollection } from 'common';

export const useUpdateDoc = <
  T extends DocumentData,
  U extends DocumentData = T,
>(
  colName: TCollection,
  onSuccess?: (ref: DocumentReference<T>) => void,
  onError?: (msg: string, err: any) => void,
  ...rest: string[]
) => {
  const firestore = useFirestore();
  const [loading, setLoading] = useState(false);

  const colRef = useMemo(
    () => createCollection<T, U>(firestore, colName, ...rest),
    [firestore, colName, rest],
  );

  const update = useCallback(
    async (docPath: string, updates: UpdateData<U>) => {
      try {
        setLoading(true);
        const docRef = doc(colRef, docPath);
        await updateDoc(docRef, {
          ...updates,
          'metadata.updated': Timestamp.now(),
        });

        setLoading(false);
        onSuccess && onSuccess(docRef);
        return docRef;
      } catch (err: any) {
        setLoading(false);
        let msg = 'an error occurred';
        if (err.message) msg += ` (${err.message})`;
        onError && onError(msg, err);
      }
    },
    [firestore, colRef, onSuccess, onError],
  );

  return { update, loading };
};
