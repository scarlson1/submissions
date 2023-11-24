import { DocumentData, UpdateData, doc, updateDoc } from 'firebase/firestore';
import { useCallback, useMemo } from 'react';
import { useFirestore } from 'reactfire';

import { TCollection, createCollection } from 'common';

export const useUpdateDoc = <T extends DocumentData, U extends DocumentData = T>(
  colName: TCollection,
  onSuccess?: () => void,
  onError?: (msg: string, err: any) => void,
  ...rest: string[]
) => {
  const firestore = useFirestore();

  const colRef = useMemo(
    () => createCollection<T, U>(firestore, colName, ...rest),
    [firestore, colName, rest]
  );

  return useCallback(
    async (docPath: string, updates: UpdateData<U>) => {
      try {
        const docRef = doc(colRef, docPath);
        await updateDoc(docRef, updates);

        onSuccess && onSuccess();
      } catch (err: any) {
        let msg = 'an error occurred';
        if (err.message) msg += ` (${err.message})`;
        onError && onError(msg, err);
      }
    },
    [firestore, colRef, onSuccess, onError]
  );
};
