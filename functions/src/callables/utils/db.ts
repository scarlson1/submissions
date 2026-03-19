import { DocumentReference } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v1/auth';

export async function getDocData<T>(docRef: DocumentReference<T>) {
  const snap = await docRef.get();
  const data = snap.data();
  if (!snap.exists || !data) throw new HttpsError('not-found', 'record not found');
  return data;
}
