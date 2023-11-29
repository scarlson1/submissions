import { WithId } from '@idemand/common';
import { DocumentReference, Query } from 'firebase-admin/firestore';
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

export async function getDoc<T>(docRef: DocumentReference<T>, errMsg: string = 'record not found') {
  const snap = await docRef.get();
  if (!snap.exists) throw new Error(errMsg);
  return snap; // TODO assert type (exists)
}

export async function getDocData<T>(
  docRef: DocumentReference<T>,
  errMsg: string = 'record not found'
) {
  const snap = await getDoc<T>(docRef, errMsg);
  const data = snap.data();
  if (!data) throw new Error(errMsg);
  return data as T;
}

export async function getQuery<T>(query: Query<T>, throwIfEmpty?: boolean) {
  const querySnap = await query.get();
  if (throwIfEmpty && querySnap.empty) throw new Error('no records found matching provided query');
  return querySnap;
}

export async function getQueryData<T>(
  query: Query<T>,
  throwIfEmpty?: boolean
): Promise<WithId<T>[]> {
  const querySnap = await getQuery(query, throwIfEmpty);
  const docData = querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id }));
  return docData;
}
