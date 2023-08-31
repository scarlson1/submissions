// https://stackoverflow.com/a/70388625/10887890
import { Firestore, collection, documentId, getDocs, query, where } from 'firebase/firestore';

import { COLLECTIONS } from 'common';

export async function getAll(db: Firestore, colName: keyof typeof COLLECTIONS, docIds: string[]) {
  const q = query(collection(db, COLLECTIONS[colName]), where(documentId(), 'in', docIds));

  const snaps = await getDocs(q);

  // return snaps.map(snap => snap.data())
  // return snaps.filter(snap => snap.exists).map(snap => snap.data())
  snaps.forEach((doc) => {
    console.log(doc.data()); // "doc1", "doc2" and "doc3"
  });
  return snaps;
}
