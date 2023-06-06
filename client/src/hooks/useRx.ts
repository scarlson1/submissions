import { collectionData, docData } from 'rxfire/firestore';
import {
  Query as FirestoreQuery,
  queryEqual,
  Query,
  getFirestore,
  doc as fsDoc,
  DocumentReference,
} from 'firebase/firestore';
import { ReactFireGlobals, ReactFireOptions, checkIdField, useObservable } from 'reactfire';

import { from, groupBy, map, mergeMap, tap, toArray } from 'rxjs';
import { innerJoin } from 'modules/rxOperators/innerJoin';
import { docJoin } from 'modules/rxOperators/docJoin';
import { populateById } from 'modules/rxOperators/innerJoinById';
import { DocumentData } from 'rxfire/firestore/interfaces';

// example group: https://stackoverflow.com/a/56307873
// DONT USE GROUPBY WITH INFINITE STREAMS

// https://github.com/FirebaseExtended/reactfire/blob/main/src/firestore.tsx
const cachedQueries: Array<FirestoreQuery> =
  (globalThis as any as ReactFireGlobals)._reactFireFirestoreQueryCache || [];

if (!(globalThis as any as ReactFireGlobals)._reactFireFirestoreQueryCache) {
  (globalThis as any as ReactFireGlobals)._reactFireFirestoreQueryCache = cachedQueries;
}

function getUniqueIdForFirestoreQuery(query: FirestoreQuery) {
  const index = cachedQueries.findIndex((cachedQuery) => queryEqual(cachedQuery, query));
  if (index > -1) {
    return index;
  }
  return cachedQueries.push(query) - 1;
}

// FOR TESTING/DEV/EXAMPLE RXJS - ONLY USED IN ORG COMPONENT FOR TEST

// JOINS ANOTHER COLLECTION BASED ON A SHARED FIELD NAME/VALUE - WORKS

export const useCollectionDataInnerJoin = <T>(
  query: Query<T>,
  joinField: string,
  coll: { root: string; pathSegments?: string[] },
  // withCollection: string,
  // pathSegments: string[] = [],
  options: ReactFireOptions<T[]> = {},
  limit: number = 100
) => {
  const idField = options ? checkIdField(options) : 'NO_ID_FIELD';
  const idSegments = coll.pathSegments ? `:${coll.pathSegments.join(':')}` : '';
  const observable1Id = `firestore:collectionData:${getUniqueIdForFirestoreQuery(
    // @ts-ignore
    query
  )}:innerJoin:${joinField}:${coll.root}${idSegments}:idField=${idField}`;

  const policies$ = collectionData<T>(query);
  const combinedObservable$ = policies$.pipe(innerJoin(getFirestore(), joinField, coll, limit));

  // TODO: need to incorporate merged query into observableId
  // ADD `innerJoin:${joinfields}` before idField=... ??
  return useObservable(observable1Id, combinedObservable$, options);
};

export const useCollectionDataPopulateById = <
  JoinKey extends string,
  T = DocumentData,
  K = DocumentData
>(
  query: Query<T>,
  joinField: JoinKey,
  coll: { root: string; pathSegments?: string[] },
  // withCollection: string,
  // pathSegments: string[] = [],
  options: ReactFireOptions<T & { [key in JoinKey]: K }[]> = {}
) => {
  const idField = options ? checkIdField(options) : 'NO_ID_FIELD';
  const idSegments = coll.pathSegments ? `:${coll.pathSegments.join(':')}` : '';
  const observable1Id = `firestore:collectionData:${getUniqueIdForFirestoreQuery(
    // @ts-ignore
    query
  )}:innerJoin:${joinField}:${coll.root}${idSegments}:idField=${idField}`;

  const policies$ = collectionData<T>(query, options);
  const combinedObservable$ = policies$.pipe(
    populateById<JoinKey, T, K>(getFirestore(), joinField, coll)
  );

  // TODO: need to incorporate merged query into observableId
  // ADD `innerJoin:${joinfields}` before idField=... ??
  return useObservable(observable1Id, combinedObservable$, options);
};

// works like mongoose populate
// TODO: typing so return type of populated docs is known
export const useRxDocJoin = <T = any, J = { [key: string]: string }>(
  docRef: DocumentReference<T>,
  // join: { [key: string]: string },
  join: { [Property in keyof J]: string },
  options?: ReactFireOptions<T[]>
) => {
  const idField = options ? checkIdField(options) : 'NO_ID_FIELD';
  const observable1Id = `firestore:collectionData:${docRef.path}}:docJoin:${JSON.stringify(
    join
  )}:idField=${idField}`;

  const policy$ = docData<T>(docRef, options);
  const combinedObservable$ = policy$.pipe(docJoin(getFirestore(), join));
  // const combinedObservable$ = policy$.pipe<T & { [Property in keyof J]: any }>(
  //   docJoin(getFirestore(), join)
  // );

  // TODO: need to incorporate merged query into observableId
  // ADD `docJoin:${joinfields}` before idField=... ??
  // return useObservable<T & { [Property in keyof J]: any }>(
  return useObservable(observable1Id, combinedObservable$, options); // as ObservableStatus<T & { [Property in keyof J]: any }>;
};

// ATTEMPTS TO GET POLICIES AND FETCH USER AFTER - not fully working

export const useRx = <T>(query: Query<T>, options?: ReactFireOptions<T[]>) => {
  const idField = options ? checkIdField(options) : 'NO_ID_FIELD';
  const observable1Id = `firestore:collectionData:${getUniqueIdForFirestoreQuery(
    // @ts-ignore
    query
  )}:idField=${idField}`;

  const policies$ = collectionData<T>(query);

  // const combinedObservable$ = policies$.pipe(
  //   tap((p) => console.log('POLICIES: ', p)),
  //   mergeMap((policies: any) =>
  //     // from EMITS EACH POLICY SEPARATELY
  //     from(policies).pipe(
  //       tap((val: any) => console.log('POLICY: ', val)),
  //       // groupBy((policy) => policy.userId),
  //       mergeMap((p) =>
  //         docData(fsDoc(getFirestore(), 'users', p.userId)).pipe(
  //           tap((u) => console.log('USER RES: ', u)),
  //           map((u) => ({ user: u, policy: p }))
  //         )
  //       ),
  //       tap((val) => console.log('CLG 3: ', val)),
  //       reduce((acc: any[], cur) => [...acc, cur], []),
  //       tap((v) => console.log('FINAL: ', v))
  //       // mergeMap(() => )
  //       // mergeMap((group$) =>
  //       //   group$.pipe(
  //       //     toArray(),
  //       //     map((p) => ({ policies: p, userId: group$.key }))
  //       //     // reduce((acc, curr) => ({ ...acc, [curr.userId]: curr.policies }), {})
  //       //   )
  //       // ),
  //       // { policies: Policy[], userId: string }
  //       // tap((preUser) => console.log('PRE USER POPULATE: ', preUser)), // toArray(),
  //       // // @ts-ignore
  //       // mergeMap((u: any) => {
  //       //   const userRef = fsDoc(getFirestore(), 'users', u.userId);
  //       //   return docData(userRef).pipe(
  //       //     map((user) => ({ ...user, userId: u.userId, policies: u.policies }))
  //       //   );
  //       //   // return docData(userRef).pipe(map((user) => [u, user]));
  //       // }),
  //       // tap((postUser) => console.log('POST USER: ', postUser)),
  //       // // map((combinedArr) => ({ ...combinedArr[1], policies: combinedArr[0].policies })),
  //       // // { ...user, policies: Policy[] }
  //       // tap((postMap) => console.log('POST MAP: ', postMap))
  //       // toArray(),
  //       // reduce((acc: any[], curr) => [...acc, curr], [])
  //       // tap((last) => console.log('LAST: ', last))
  //     )
  //   )
  // );

  const combinedObservable$ = policies$.pipe(
    tap((p) => console.log('POLICIES: ', p)),
    mergeMap((policies: any) =>
      // if (!policies) return of([])
      // from EMITS EACH POLICY SEPARATELY
      from(policies).pipe(
        tap((val: any) => console.log('CLG 2: ', val)),
        // returns observable for each group of policies, grouped by userId
        groupBy((policy) => policy.userId),
        tap((val) => console.log('GROUPED: ', val)),
        mergeMap((group$) =>
          group$.pipe(
            toArray(),
            map((p) => ({ policies: p, userId: group$.key }))
            // reduce((acc, curr) => ({ ...acc, [curr.userId]: curr.policies }), {})
          )
        ),
        // { policies: Policy[], userId: string }
        tap((preUser) => console.log('PRE USER POPULATE: ', preUser)), // toArray(),
        // @ts-ignore
        mergeMap((u: any) => {
          const userRef = fsDoc(getFirestore(), 'users', u.userId);
          return docData(userRef).pipe(
            map((user) => ({ ...user, userId: u.userId, policies: u.policies }))
          );
          // return docData(userRef).pipe(map((user) => [u, user]));
        }),
        tap((postUser) => console.log('POST USER: ', postUser)),
        // map((combinedArr) => ({ ...combinedArr[1], policies: combinedArr[0].policies })),
        // { ...user, policies: Policy[] }
        tap((postMap) => console.log('POST MAP: ', postMap))
        // toArray(),
        // reduce((acc: any[], curr) => [...acc, curr], [])
        // tap((last) => console.log('LAST: ', last))
      )
    )
  );

  return useObservable(observable1Id, combinedObservable$, options);

  // const observable1$ = collectionData<T>(query, { idField });

  // WORKS  returns { [policyId]: policyData }
  // useEffect(() => {
  //   const subscription = observable1$
  //     .pipe(
  //       map((data) => data.reduce((a, c  => Object.assign(a, { [c.policyId]: c }), {})
  //       )
  //     )
  //     .subscribe((result) => {
  //       console.log('RESULT: ', result);
  //     });

  //   return () => subscription.unsubscribe();
  // }, [observable1$]);

  // const observable1 = useObservable(observable1Id, observable1$, options1);
  // const [data, setData] = useState<any[]>([]);

  // WORKS - DONT DELETE
  // const policies$ = collectionData<T>(query);
  // const combinedObservable$ = policies$.pipe(
  //   tap((p) => console.log('POLICIES: ', p)),
  //   mergeMap((policies: any) =>
  //     // // from EMITS EACH POLICY SEPARATELY
  //     from(policies).pipe(
  //       tap((val: any) => console.log('CLG 2: ', val)),
  //       // @ts-ignore
  //       mergeMap((policy: any) => {
  //         const userRef = fsDoc(getFirestore(), 'users', policy.userId);
  //         return docData(userRef).pipe(map((user) => [policy, user]));
  //       }),
  //       map((combinedArr) => ({ ...combinedArr[0], user: combinedArr[1] }))
  //     )
  //   )
  // );

  // useEffect(() => {
  //   const subscription = combinedObservable$.subscribe((policyData) => {
  //     console.log('POLICY DATA: ', policyData);
  //     setData((d) => [...d, policyData]);
  //   });

  //   return () => subscription.unsubscribe();
  // }, [combinedObservable$]);

  // return {
  //   data,
  // }; // observable1
};

// https://stackoverflow.com/a/61495306

// mergeMap(x => {
//   // return combineLatestWith(...x.map(c => {
//   //   const ref = storageRef(getStorage(), `/path/....png`);
//   //   return getDownloadURL(ref).pipe(map(imgURL => ({ imgURL, ...c })))
//   // }))
// })

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
