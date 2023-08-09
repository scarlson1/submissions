import { DocumentReference, getDoc } from 'firebase/firestore';

export async function getData<T>(ref: DocumentReference<T>) {
  const snap = await getDoc(ref);
  const data = snap.data();
  if (!data) throw new Error('policy not found');
  return { ...data, id: ref.id };
}
