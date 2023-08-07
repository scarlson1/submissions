import { DocumentReference } from 'firebase-admin/firestore';

export async function getDoc<T>(docRef: DocumentReference<T>, errMsg: string = 'record not found') {
  const snap = await docRef.get();
  const data = snap.data();
  if (!snap.exists || !data) throw new Error(errMsg);
  return data;
}
