import { useCallback } from 'react';
import { useFirestore } from 'reactfire';
import { DocumentData } from 'rxfire/firestore/interfaces';
import { CollectionReference, collection, doc, getDoc } from 'firebase/firestore';
import { capitalize } from 'lodash';
import { toast } from 'react-hot-toast';

import { useJsonDialog } from './useJsonDialog';

export const useShowJson = <T extends DocumentData>(
  colName: string,
  paths: string[] = [],
  getTitle?: (data: T) => string
) => {
  const firestore = useFirestore();
  const dialog = useJsonDialog();
  const colRef = collection(firestore, colName, ...paths) as CollectionReference<T>;

  const showJson = useCallback(
    async (docId: string) => {
      try {
        const snap = await getDoc(doc(colRef, docId));
        const data = snap.data();
        if (!snap.exists || !data) throw new Error(`doc not found (${colName}/${docId})`);

        let title;
        if (getTitle) {
          title = getTitle(data);
        } else {
          title = `${capitalize(colName)}`;
          if (paths.length) {
            for (let p of paths) title += ` / ${capitalize(p)}`;
          }
          title += ` ${docId} Data`;
        }

        dialog(data, title);
      } catch (err: any) {
        let msg = `Error fetching data (ID: ${docId})`;
        if (err?.message) msg = err.message;
        toast.error(msg);
      }
    },
    [colRef, colName, paths, dialog, getTitle]
  );

  return showJson;
};
