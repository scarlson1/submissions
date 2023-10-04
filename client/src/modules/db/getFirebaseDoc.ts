import { DocumentReference, getDoc } from 'firebase/firestore';

export async function getFirebaseDoc<T>(ref: DocumentReference<T>) {
  const snap = await getDoc(ref);
  const data = snap.data();
  if (!data) throw new Error('record not found');
  return data;
}
