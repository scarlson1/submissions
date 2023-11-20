import { collectionGroup, doc, query, where } from 'firebase/firestore';
import { useMemo } from 'react';
import { ReactFireOptions, useFirestore, useObservable } from 'reactfire';
import { collectionData, docData } from 'rxfire/firestore';
import { combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import invariant from 'tiny-invariant';

import { Collection, usersCollection } from 'common';
import { useClaims } from './useClaims';

// TODO: replace deprecated combineLatest

// https://github.com/firebaseextended/rxfire#easily-combine-multiple-firebase-data-sources

export const useUsers = <T>(options?: ReactFireOptions<T>) => {
  const { user, claims, orgId } = useClaims();
  invariant(user);
  const firestore = useFirestore();

  const constraint = useMemo(() => {
    if (claims.iDemandAdmin) return []; // will return all docs where access doc exists
    if (claims.orgAdmin) return [where('orgIds', 'array-contains', orgId)];
    if (claims.agent && user?.uid) return [where('agentIds', 'array-contains', user.uid)];
    return [where('userId', '==', user.uid)];
  }, [user, claims, orgId]);

  const accessRef = query(collectionGroup(firestore, Collection.Enum.permissions), ...constraint);
  const usersCol = usersCollection(firestore);

  const observableId = `users:${user.uid}:associated`;

  const observable$ = collectionData(accessRef).pipe(
    switchMap((accessData) => {
      return combineLatest(
        ...accessData.map((c) => {
          // const ref = ref(storage, `/cities/${c.id}.png`);
          const userRef = doc(usersCol, c.userId);
          return docData(userRef).pipe(map((userData) => ({ ...userData, accessData })));
          // return getDownloadURL(ref).pipe(map(imageURL => ({ imageURL, ...c })));
        })
      );
    })
  );

  return useObservable(observableId, observable$, options);
};
