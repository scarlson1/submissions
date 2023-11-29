import { DocumentReference } from 'firebase-admin/firestore';
import { customAlphabet } from 'nanoid';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const nanoId = customAlphabet(ALPHABET, 9);

export const createDocId = nanoId;

export const prefixedDocIdFactory = (prefix: string, number?: number) => () =>
  `${prefix}${createDocId(number)}`;

export const createTaxTrxId = prefixedDocIdFactory('tt_', 6);
export const createTaxId = prefixedDocIdFactory('tax_', 6);
export const createTaxCalcId = prefixedDocIdFactory('taxcalc_', 6);

export const createTransferGroupId = (policyId: string) => `tg_${policyId}_${nanoId(5)}`;

/**
 * Check if a transaction already exists in database
 * @param {DocumentReference} docRef doc ref of transaction
 * @returns {boolean} returns boolean indicated if transaction exists for provided ref
 */
export const docExists = (docRef: DocumentReference) => {
  return docRef.get().then((snap) => snap.exists);
};
