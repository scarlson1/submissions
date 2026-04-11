import {
  collectionGroup,
  CollectionReference,
  doc,
  query,
  where,
} from 'firebase/firestore';
import { useMemo } from 'react';
import { ReactFireOptions, useFirestore, useObservable } from 'reactfire';
import { collectionData, docData } from 'rxfire/firestore';
import { combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import invariant from 'tiny-invariant';
import { useClaims } from './useClaims';

import { Collection } from '@idemand/common';
import { User, UserAccess, usersCollection } from 'common';

// TODO: replace deprecated combineLatest

// https://github.com/firebaseextended/rxfire#easily-combine-multiple-firebase-data-sources

interface UsersRes extends User {
  accessData: UserAccess;
  id: string;
}

export const useUsers = <T = UsersRes>(options?: ReactFireOptions<T>) => {
  const { user, claims, orgId } = useClaims();
  invariant(user);
  const firestore = useFirestore();

  const constraint = useMemo(() => {
    if (claims.iDemandAdmin) return []; // will return all docs where access doc exists
    if (claims.orgAdmin) return [where('orgIds', 'array-contains', orgId)];
    if (claims.agent && user?.uid)
      return [where('agentIds', 'array-contains', user.uid)];
    return [where('userId', '==', user.uid)];
  }, [user, claims, orgId]);

  const accessQuery = query<UserAccess, UserAccess>(
    collectionGroup(
      firestore,
      Collection.Enum.permissions,
    ) as CollectionReference<UserAccess, UserAccess>,
    ...constraint,
  );
  const usersCol = usersCollection(firestore);

  const idField = options?.idField ?? 'NO_ID_FIELD';
  const observableId = `users:${user.uid}:associated:idField=${idField}`;

  const observable$ = collectionData(accessQuery).pipe(
    switchMap((accessData) => {
      return combineLatest(
        ...accessData.map((c) => {
          // const ref = ref(storage, `/cities/${c.id}.png`);
          const userRef = doc(usersCol, c.userId);
          return docData(userRef).pipe(
            map((userData) => ({ ...userData, accessData, id: c.userId })),
          );
          // return getDownloadURL(ref).pipe(map(imageURL => ({ imageURL, ...c })));
        }),
      );
    }),
  );

  return useObservable(observableId, observable$, options);
};
