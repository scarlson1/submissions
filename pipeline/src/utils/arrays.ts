import type { Collection } from '@idemand/common';
import type { DocumentData, Firestore } from 'firebase-admin/firestore';

/**
 * Batch-fetch documents by ID from a single collection.
 * Splits into chunks of 500 to stay within db.getAll limits.
 * Returns only snapshots that exist, cast to T.
 */
export async function getByIds<T extends DocumentData>(
  db: Firestore,
  collectionPath: Collection, // string,
  ids: string[],
): Promise<Array<{ id: string; data: T }>> {
  if (!ids.length) return [];

  const refs = ids.map((id) => db.collection(collectionPath).doc(id));
  const chunks = splitChunks(refs, 500);
  const snaps = (
    await Promise.all(chunks.map((chunk) => db.getAll(...chunk)))
  ).flat();

  return snaps
    .filter((snap) => snap.exists)
    .map((snap) => ({ id: snap.id, data: snap.data() as T }));
}

/**
 * Split an array of items into array of provided size
 * @param {any[]} data - array of data
 * @param {number} size - number of items in each chunk
 * @returns {Array} return array of arrays of "size" length
 */
export function splitChunks<T = any>(data: T[], size: number) {
  const chunks = [];
  // for (let i = 0; i < data.length; i += size) chunks.push(data.slice(i, i + size));
  if (size < 1)
    throw new Error('splitChunks array size must be a positive number');
  for (let i = 0; i < data.length; i += size) {
    chunks.push(data.slice(i, i + size));
  }

  return chunks;
}
