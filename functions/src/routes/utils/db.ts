import { DocumentReference } from 'firebase-admin/firestore';

// TODO: delete use from /modules/db/utils
export async function getDocData<T>(
  docRef: DocumentReference<T>,
  errMsg: string = 'record not found'
) {
  const snap = await docRef.get();
  const data = snap.data();
  if (!snap.exists || !data) throw new Error(errMsg);
  return data;
}
