import {
  CollectionReference,
  FirestoreDataConverter,
  collection,
  doc,
  getDoc,
} from 'firebase/firestore';
import { capitalize } from 'lodash';
import { useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useFirestore } from 'reactfire';
import { DocumentData } from 'rxfire/firestore/interfaces';

import { WithId } from 'common';
import { useJsonDialog } from './useJsonDialog';

// could add another func for querying collection
// showJsonWhere

export const useShowJson = <T extends DocumentData>(
  colName: string,
  paths: string[] = [],
  getTitle?: null | ((data: WithId<T>) => string),
  converter?: FirestoreDataConverter<T>
) => {
  const firestore = useFirestore();
  const dialog = useJsonDialog({ slotProps: { dialog: { maxWidth: 'md' } } });

  const colRef = useMemo(() => {
    let cr = collection(firestore, colName, ...paths) as CollectionReference<T>;
    if (converter) cr = cr.withConverter(converter);

    return cr;
  }, [firestore, colName, paths, converter]);

  const showJson = useCallback(
    async (docId: string, subPath?: string) => {
      try {
        let docPath = subPath ? `${subPath}/${docId}` : docId;
        const snap = await getDoc(doc(colRef, docPath));
        const data = snap.data();
        if (!snap.exists || !data) throw new Error(`doc not found (${colName}/${docId})`);

        let title;
        if (getTitle) {
          title = getTitle({ ...data, id: snap.id });
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
