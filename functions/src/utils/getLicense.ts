import { info } from 'firebase-functions/logger';
import { Firestore, Timestamp } from 'firebase-admin/firestore';

import { Nullable, licensesCollection } from '../common';

export async function getSLLicenseByState(
  firestore: Firestore,
  state: string,
  effDate?: Nullable<Timestamp>,
  expDate?: Nullable<Timestamp>
) {
  const licensesCol = licensesCollection(firestore);
  let q = licensesCol.where('state', '==', state).where('surplusLinesProducerOfRecord', '==', true);

  if (effDate) q = q.where('effectiveDate', '<=', effDate);

  const licenseSnap = await q.get();

  // TODO: report error to sentry
  if (licenseSnap.empty) throw new Error(`not licensed in state (${state})`);

  let licenseDocs = licenseSnap.docs.map((snap) => snap.data());

  // filter for license eff and exp date
  if (expDate) {
    licenseDocs = licenseDocs.filter(
      // @ts-ignore
      (l) => !l.expirationDate || l.expirationDate.toMillis() >= expDate!.toMillis()
    );
  }

  info(`SL License lookup result: ${licenseDocs.length} matches`, { licenseDocs });

  if (!licenseDocs.length) throw new Error(`No valid license found matching state and term`);

  return licenseDocs[0];
}
