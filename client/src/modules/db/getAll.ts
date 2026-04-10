// https://stackoverflow.com/a/70388625/10887890
import {
  collection,
  CollectionReference,
  doc,
  DocumentData,
  documentId,
  Firestore,
  getDoc,
  getDocs,
  query,
  where,
  type DocumentSnapshot,
} from 'firebase/firestore';

import { TCollection } from 'common';

// TODO: support sub collections
// limited to 10 docs
export async function getAll<T extends DocumentData>(
  db: Firestore,
  colName: TCollection,
  docIds: string[],
) {
  const colRef = collection(db, colName) as CollectionReference<T>;
  const q = query(colRef, where(documentId(), 'in', docIds));

  const snaps = await getDocs(q);

  // return snaps.map(snap => snap.data())
  // return snaps.filter(snap => snap.exists).map(snap => snap.data())
  // snaps.forEach((doc) => {
  //   console.log(doc.data()); // "doc1", "doc2" and "doc3"
  // });
  return snaps;
}

export async function getAllById<T extends DocumentData>(
  db: Firestore,
  colName: TCollection,
  docIds: string[],
) {
  const colRef = collection(db, colName) as CollectionReference<T>;
  const promises: Promise<DocumentSnapshot<T>>[] = [];
  for (let id of docIds) {
    promises.push(getDoc(doc(colRef, id)));
  }

  const res = await Promise.all(promises);
  return res;
}
