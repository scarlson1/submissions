import { DocumentData, DocumentReference, Firestore, doc as fsDoc } from 'firebase/firestore';
import { docData } from 'rxfire/firestore';
import { Observable, combineLatest, defer, map, of, switchMap, tap } from 'rxjs';

// REQUIRES SAME DOCUMENT FIELD IN BOTH DOCUMENTS/COLLECTION
// EXAMPLE
// user = { userId: '123', ...rest }
// policy = { userId: '123', ...rest }
// --> returns: { ...user, [lastSegmentName]: { ...doc }}

type DynamicSegments = string[] | { value: string; fromDoc?: boolean }[];

const getPaths = (segments: DynamicSegments, doc: DocumentData) =>
  segments.map((s) => (typeof s === 'string' ? s : s.fromDoc ? doc[s.value] : s.value));

// function isFish(pet: Fish | Bird): pet is Fish {
//   return (pet as Fish).swim !== undefined;
// }

// function isDocWithProp<T>(doc: any, field: string): doc is T {
//   return (doc as T)[field] !== undefined;
// }

/**
 * Joins docs from another collection using id from docIdField and coll path
 * @param {Firestore} firestore - firestore instance
 * @param {string} docIdField - field present on doc and used to match on populate collection
 * @param {object} coll - name of the collection to search
 * @returns {Observable<unknown>} - combined observable of parent documents with a field using the collection name as the key and an array of any documents in the collection matching the field:value from the parent
 */

// TODO: USE OBJECT / ARRAY TO ALLOW MULTIPLE POPULATES

export const populateById = <JoinKey extends string, T = DocumentData, K = DocumentData>(
  firestore: Firestore,
  docIdField: JoinKey,
  coll: { root: string; pathSegments?: DynamicSegments }
) => {
  return (source: Observable<T[]>) =>
    defer(() => {
      // OPERATOR STATE
      let collectionData: T[];
      let totalJoins = 0;

      return source.pipe(
        switchMap((data) => {
          console.log('COLLECTION DATA:', data);
          // Clear mapping on each emitted val
          // Save the parent data state
          collectionData = data; // as T[]; // as any

          const reads$: Observable<K | {}>[] = [];
          // const reads$: Observable<K | undefined>[] = []; // | Observable<{}>
          for (const doc of collectionData) {
            // Push doc read to Array
            // only get docs where shared key:value pair in both collections
            // @ts-ignore // TODO: type checking / assertion
            if (doc[docIdField]) {
              // if (docIdField in doc) {
              // Perform query to join key, with optional limit
              const segments = coll.pathSegments
                ? getPaths(coll.pathSegments, doc as DocumentData)
                : [];

              const joinDocRef = fsDoc(
                firestore,
                coll.root,
                ...segments, // @ts-ignore
                doc[docIdField]
              ) as DocumentReference<K>;

              // @ts-ignore TODO: fix type
              reads$.push(docData(joinDocRef));
            } else {
              reads$.push(of({}));
            }
          }

          return combineLatest(reads$);
        }),
        map((joins: (K | {})[]) => {
          console.log('JOINS: ', joins);
          const lastSegment =
            coll.pathSegments && coll.pathSegments.length > 0
              ? coll.pathSegments[coll.pathSegments.length - 1]
              : null;

          const keyName = lastSegment
            ? typeof lastSegment === 'string'
              ? lastSegment
              : lastSegment.value
            : coll.root;
          // const keyName = `${coll.root}${
          //   coll.pathSegments ? `:` + coll.pathSegments.join(':') : ''
          // }`;

          return collectionData.map((v, i) => {
            // if (joins[i]) totalJoins += joins[i].length || 0;
            if (joins[i]) totalJoins++;
            return { ...v, [keyName]: joins[i] || null };
          });
        }),
        tap((final) => {
          console.log(`Queried ${(final as any).length}, joined ${totalJoins} docs`);
          totalJoins = 0;
        })
      );
    });
};

// USAGE

// const policies$ = collectionData<T>(query);
// const combinedObservable$ = policies$.pipe(innerJoin(getFirestore(), 'userId', 'submissions'));

// this.joined = this.firestore
//   .collection('users')
//   .valueChanges()
//   .pipe(
//     innerJoin(firestore, 'userId', 'orders'),
//     shareReplay(1)
//   )
