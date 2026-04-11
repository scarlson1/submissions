import {
  getDocs,
  query,
  QueryConstraint,
  Timestamp,
  where,
  type QuerySnapshot,
} from 'firebase/firestore';
import { useCallback } from 'react';
import { useFirestore } from 'reactfire';

import type { WithId } from '@idemand/common';
import { License, licensesCollection } from 'common';
import { splitChunks } from 'modules/utils';

// TODO: 'in' query constraint limited to 10
// https://stackoverflow.com/a/66265824

// , onSuccess?: (license: License[]) => void, onError?: (msg: string, err?: unknown) => void
export const useFetchLicenses = (constraints?: QueryConstraint[]) => {
  const firestore = useFirestore();

  return useCallback(
    async (states: string[], effDate?: Timestamp) => {
      const licensesCol = licensesCollection(firestore);

      const promises: Promise<QuerySnapshot<License, License>>[] = [];
      let statesArr = splitChunks(states, 10);

      for (let chunk of statesArr) {
        const q = query(
          licensesCol,
          where('state', 'in', chunk),
          ...(constraints || []),
        );

        promises.push(getDocs(q));
      }
      // const q = query(
      //   licensesCol,
      //   where('state', 'in', states),
      //   ...(constraints || [])
      // );

      // const snaps = await getDocs(q);
      const snapsArr = await Promise.all(promises);
      // const flattenedSnaps = snapsArr.flat();

      let licenses: WithId<License>[] = [];

      snapsArr.forEach((group) => {
        group.forEach((s) => {
          licenses.push({ id: s.id, ...s.data() });
        });
      });
      console.log('LICENSES: ', licenses);

      return licenses;
    },
    [firestore, constraints],
  );
};
