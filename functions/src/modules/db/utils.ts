import { customAlphabet } from 'nanoid';

import { DocumentReference } from 'firebase-admin/firestore';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const nanoId = customAlphabet(ALPHABET, 9);

export const createDocId = nanoId;

/**
 * Check if a transaction already exists in database
 * @param {DocumentReference} docRef doc ref of transaction
 * @returns {boolean} returns boolean indicated if transaction exists for provided ref
 */
export const docExists = (docRef: DocumentReference) => {
  return docRef.get().then((snap) => snap.exists);
};
