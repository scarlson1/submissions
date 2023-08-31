import { CollectionReference, DocumentData, FieldPath, Firestore } from 'firebase-admin/firestore';

// Two ways to get group of docs by ID:
//  - getAll(refs)
//  - myCollection.where(firestore.FieldPath.documentId(), 'in', ["123","456","789"])
// https://stackoverflow.com/a/53508963

export async function getAll<T = DocumentData>(
  db: Firestore,
  collectionPath: string | string[],
  docIds: string[]
) {
  let basePath =
    typeof collectionPath === 'string'
      ? `${collectionPath}/`
      : collectionPath.map((segment) => `${segment}/`);

  const refs = docIds.map((id) => db.doc(`${basePath}${id}`));

  const snaps = await db.getAll(...refs);
  return snaps.filter((snap) => snap.exists).map((snap) => snap.data()) as T[];
}

export async function getAllById<T = DocumentData>(
  colRef: CollectionReference<T>,
  docIds: string[]
) {
  return colRef.where(FieldPath.documentId(), 'in', docIds).get();
}
