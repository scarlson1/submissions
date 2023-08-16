import { ReactFireOptions, useFirestore, useObservable } from 'reactfire';
// collectionCount not exported error
// import { collectionCount } from 'rxfire/firestore';
import {
  AggregateField,
  AggregateQuerySnapshot,
  Query,
  QueryFieldFilterConstraint,
  collection,
  collectionGroup,
  getCountFromServer,
  query,
} from 'firebase/firestore';
import { Observable, from } from 'rxjs';
import { map, repeat } from 'rxjs/operators';

// https://github.com/FirebaseExtended/rxfire/blob/main/docs/firestore.md#collectioncount

// TODO: handle errors (DEADLINE_EXCEEDED)
// https://firebase.google.com/docs/firestore/query-data/aggregation-queries#limitations

type CountSnapshot = AggregateQuerySnapshot<{
  count: AggregateField<number>;
}>;

export function collectionCountSnap(query: Query<unknown>): Observable<CountSnapshot> {
  return from(getCountFromServer(query));
}

export function collectionCount(query: Query<unknown>): Observable<number> {
  return collectionCountSnap(query).pipe(map((snap) => snap.data().count));
}

export const useDocCount = (
  colName: string,
  constraints: QueryFieldFilterConstraint[] = [],
  isCollectionGroup: boolean = false,
  pathSegments: string[] = [],
  options?: ReactFireOptions | undefined
) => {
  const firestore = useFirestore();

  let path = `${colName}`;
  if (pathSegments.length) path += `/${pathSegments.join('/')}`;

  let colRef;
  if (!!isCollectionGroup) {
    colRef = collectionGroup(firestore, path);
  } else {
    colRef = collection(firestore, path);
  }

  const q = query(colRef, ...constraints);

  // refetch every 30 seconds, until 60 fetches (~ 30 mins)
  const observable$ = collectionCount(q).pipe(repeat({ count: 60, delay: 30 * 1000 }));

  const observableId = `firestore:count:${path}:${JSON.stringify(constraints)}:aggregate-count`;

  return useObservable(observableId, observable$, options);
};

// NEED TO USE RXJS repeat for up to day read
// https://github.com/FirebaseExtended/rxfire/blob/main/docs/firestore.md#collectioncount
