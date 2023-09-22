import { Firestore, Timestamp } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';

import { Product, moratoriumsCollection } from '../common/index.js';

export async function checkMoratoriums(
  firestore: Firestore,
  counties: string[],
  effDate: Timestamp,
  product: Product
) {
  const q = moratoriumsCollection(firestore)
    .where('locations', 'array-contains-any', counties)
    .where('effectiveDate', '<=', effDate)
    .where(`product.${product}`, '==', true);

  const snap = await q.get();

  const moratoriums = snap.docs
    .map((snap) => ({ ...snap.data(), id: snap.id }))
    .filter((doc) => {
      if (!doc.expirationDate) return true;

      return doc.expirationDate.toMillis() > effDate.toMillis();
    });
  info('MORATORIUMS: ', moratoriums);

  return { isMoratorium: moratoriums.length > 0, moratoriums };
}
