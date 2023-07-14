import { info } from 'firebase-functions/logger';
import { Firestore, Timestamp } from 'firebase-admin/firestore';

import { licensesCollection } from '../common';

export async function getSLLicenseByState(
  firestore: Firestore,
  state: string,
  effDate?: Timestamp // Nullable<Timestamp>,
  // expDate?: Timestamp // Nullable<Timestamp>
) {
  const licensesCol = licensesCollection(firestore);
  let q = licensesCol.where('state', '==', state).where('surplusLinesProducerOfRecord', '==', true);

  if (effDate) q = q.where('effectiveDate', '<=', effDate);

  const licenseSnap = await q.get();

  // TODO: report error to sentry
  if (licenseSnap.empty) throw new Error(`not licensed in state (${state})`);

  let licenseDocs = licenseSnap.docs.map((snap) => snap.data());
  info(`License docs (${licenseDocs.length} found)`, {
    note: 'pre expiration date filtering',
    licenseDocs,
  });

  // TODO: decide whether to keep expiration date filter (could be renewed at later date)
  // filter for license eff and exp date
  // if (expDate) {
  //   licenseDocs = licenseDocs.filter(
  //     (l) =>
  //       !l.expirationDate ||
  //       (expDate === null ? true : l.expirationDate.toMillis() >= expDate!.toMillis())
  //   );
  // }

  info(`SL License lookup result: ${licenseDocs.length} matches`, { licenseDocs });

  if (!licenseDocs.length) throw new Error(`No valid license found matching state and term`);

  return licenseDocs[0];
}
