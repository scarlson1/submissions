import { DocumentReference, getDoc } from 'firebase/firestore';

export async function getData<T>(ref: DocumentReference<T>, errMsg: string = 'record not found') {
  const snap = await getDoc(ref);
  const data = snap.data();
  if (!(snap.exists() && data)) throw new Error(errMsg);
  return { ...data, id: ref.id };
}
