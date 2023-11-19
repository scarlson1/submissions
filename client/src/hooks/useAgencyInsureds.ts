import { DocumentReference, doc, getDoc, getFirestore, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { Policy, User, WithId } from 'common';
import { useCollectionData } from './useCollectionData';

let uniq = (a: any) => [...new Set(a)];

export const useAgencyInsureds = (agencyId: string) => {
  const [userIds, setUserIds] = useState<string[]>([]);
  const [users, setUsers] = useState<WithId<User>[]>([]);
  // const [cursor, setCursor] = useState()

  const { data: policies, status } = useCollectionData<Policy>(
    'policies',
    [where('orgId', '==', agencyId)],
    { suspense: false }
  );

  useEffect(() => {
    if (!policies || !policies.length) return;

    let userIds = policies.map(({ userId }) => userId).filter((x) => x);
    // console.log('USER IDS: ', userIds);
    let uUids = uniq(userIds) as string[];
    // console.log('UNIQUE IDS: ', uUids);
    setUserIds([...uUids]);

    // ISSUES:
    // not scalable - what if thousands of users ??
    // limit first query??
    // use cursor ? return 10 at a time ?
    // TODO: find better way to associate insureds with agents
  }, [policies]);

  useEffect(() => {
    for (let uid of userIds) {
      let ref = doc(getFirestore(), `users`, uid) as DocumentReference<User>;
      getDoc(ref).then((snap) => {
        if (snap.exists()) {
          let t = { ...snap.data(), id: snap.id };
          // console.log('TEST: ', t);
          setUsers((u) => [...u, t]);
        }
      });
    }
  }, [userIds]);

  return {
    loading: status === 'loading',
    policies,
    users,
  };
};

// import { Policy } from 'common';
// import { Query, collection, doc, getFirestore } from 'firebase/firestore';
// import { useEffect, useState } from 'react';
// import { ObservableStatus, ReactFireOptions, useObservable } from 'reactfire';
// import { collectionData, docData } from 'rxfire/firestore';
// import { GroupedObservable, combineLatest, from, merge, of, zip } from 'rxjs';
// import {
//   concatMap,
//   distinct,
//   groupBy,
//   map,
//   mergeMap,
//   reduce,
//   switchMap,
//   toArray,
// } from 'rxjs/operators'; // , switchMap, filter

// // const subscription = combineLatest(profile$, cart$, (profile, cart) => {
// //   // transform the profile to add the cart as a child property
// //   profile.cart = cart;
// //   return profile;
// // }).subscribe((profile) => {
// //   console.log('joined data', profile);
// // });

// // Unsubscribe to both collections in one call!
// // subscription.unsubscribe();

// export const useAgencyInsureds = <T = Policy>(
//   query: Query<T>,
//   // query2: Query<U>,
//   options?: ReactFireOptions<T[]>
// ): ObservableStatus<T[]> => {
//   const idField = 'policyId';
//   // const idField2 = 'uid';
//   const observableId = `firestore:collectionData:${'test'}`;
//   const policies$ = collectionData<T>(query, { idField });
//   // const users$ = collectionData(query2, { idField: idField2 });

//   const [vals, setVals] = useState<any>([]);

//   // useEffect(() => {
//   //   const t = policies$
//   //     .pipe(
//   //       concatMap(from), // COMBINES RESULTS AS THEIR EMITTED
//   //       groupBy(({ userId }) => userId), // GROUP BY USER ID - OUTPUTS KEY=uid, observable
//   //       map((x) => {
//   //         console.log('GROUPED: ', x);
//   //         return x;
//   //       }),
//   //       mergeMap((group) => zip(of(group.key), group.pipe(toArray())))
//   //       // mergeMap((group) => group.pipe(toArray()))
//   //       // concatMap(
//   //       //   (groupedPoliciesObserver) =>
//   //       //     docData(doc(getFirestore(), `users/${groupedPoliciesObserver.key}`), { idField: 'uid' })
//   //       // ),
//   //       // mergeMap((ob1Val: GroupedObservable<any, any>) => {
//   //       //   console.log('observable1:', ob1Val);

//   //       //   const users$ = docData(doc(getFirestore(), `users/${ob1Val.key}`), { idField: 'uid' });
//   //       // // distinct(({ userId }) => userId),
//   //       // // reduce((policies: Policy[], policy: Policy) => [...policies, policy], []),

//   //     )
//   //     .subscribe(console.log);
//   //   // (x) => {
//   //   //   console.log('OUTPUT: ', x);
//   //   //   setVals((prev: any) => [...prev, x]);
//   //   // };

//   //   return () => t.unsubscribe();
//   // }, [policies$]);

//   // https://stackoverflow.com/a/56496562 (concatMap + distinct)

//   // policies --> unique userId
//   // get users from unique ids
//   // merge? return useObservable of the new observable ??

//   // .pipe(distinct(({ userId }) => userId))

//   // const combinedObservable$ =

//   console.log('VALS: ', vals);
//   return useObservable(observableId, policies$, options);
// };

// // COLLECTION DATA IN REACTFIRE:

// // /**
// //  * Subscribe to a Firestore collection and unwrap the snapshot into an array.
// //  */
// // export function useFirestoreCollectionData<T = DocumentData>(
// //   query: FirestoreQuery<T>,
// //   options?: ReactFireOptions<T[]>
// // ): ObservableStatus<T[]> {
// //   const idField = options ? checkIdField(options) : 'NO_ID_FIELD';
// //   const observableId = `firestore:collectionData:${getUniqueIdForFirestoreQuery(
// //     query
// //   )}:idField=${idField}`;
// //   const observable$ = collectionData(query, { idField });

// //   return useObservable(observableId, observable$, options);
// // }

// // https://www.esveo.com/en/blog/nY - run requests in parallel with combineLatest

// // const userDetails$ = users$.pipe(
// //   switchMap((userSummaries) => {
// //     const userDetailObservables = userSummaries.map((s) => from(loadUserDetails(s.id)));

// //     const userDetails$ = combineLatest(userDetailObservables);
// //     return userDetails$;
// //   })
// // );
