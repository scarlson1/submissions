import { DocumentData, CollectionReference, Firestore } from 'firebase-admin/firestore';

import { COLLECTIONS, Moratorium, Tax, License } from './index.js';

const createCollection = <T = DocumentData>(db: Firestore, collectionName: string) => {
  return db.collection(collectionName) as CollectionReference<T>;
};

export const taxesCollection = (db: Firestore) =>
  createCollection<Tax>(db, COLLECTIONS.SURPLUS_LINES_TAXES);
export const moratoriumsCollection = (db: Firestore) =>
  createCollection<Moratorium>(db, COLLECTIONS.MORATORIUMS);

export const usersCollection = (db: Firestore) => createCollection<any>(db, COLLECTIONS.USERS);
export const licensesCollection = (db: Firestore) =>
  createCollection<License>(db, COLLECTIONS.LICENSES);
export const swissReResCollection = (db: Firestore) => createCollection(db, COLLECTIONS.SR_RES);
