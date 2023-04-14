import { Firestore, doc as fsDoc } from 'firebase/firestore';
import { docData } from 'rxfire/firestore';
import { combineLatest, defer, map, of, switchMap, tap } from 'rxjs';

// REQUIRES SAME DOCUMENT FIELD IN BOTH DOCUMENTS/COLLECTION
// EXAMPLE
// user = { userId: '123', ...rest }
// policy = { userId: '123', ...rest }
// --> returns: { ...user, [lastSegmentName]: { ...doc }}

type dynamicSegments = string[] | { value: string; fromDoc?: boolean }[];

const getPaths = (segments: dynamicSegments, doc: { [key: string]: any }) =>
  segments.map((s) => (typeof s === 'string' ? s : s.fromDoc ? doc[s.value] : s.value));

/**
 * Joins docs from another collection using id from docIdField and coll path
 * @param {Firestore} firestore - firestore instance
 * @param {string} docIdField - field present on doc and used to match on populate collection
 * @param {object} coll - name of the collection to search
 * @returns {Observable<unknown>} - combined observable of parent documents with a field using the collection name as the key and an array of any documents in the collection matching the field:value from the parent
 */

// TODO: USE OBJECT / ARRAY TO ALLOW MULTIPLE POPULATES

export const populateById = (
  firestore: Firestore,
  docIdField: string,
  coll: { root: string; pathSegments?: dynamicSegments }
) => {
  return (source: any) =>
    defer(() => {
      // OPERATOR STATE
      let collectionData: any;

      let totalJoins = 0;

      return source.pipe(
        switchMap((data) => {
          // Clear mapping on each emitted val

          // Save the parent data state
          collectionData = data as any[];

          const reads$ = [];
          for (const doc of collectionData) {
            // Push doc read to Array

            // only get docs where shared key:value pair in both collections
            if (doc[docIdField]) {
              // Perform query to join key, with optional limit
              const segments = coll.pathSegments ? getPaths(coll.pathSegments, doc) : [];

              const docRef = fsDoc(
                firestore,
                coll.root,
                ...segments,
                // ...(coll.pathSegments || []),
                doc[docIdField]
              );

              reads$.push(docData(docRef));
            } else {
              reads$.push(of({}));
            }
          }

          return combineLatest(reads$);
        }),
        map((joins: any[]) => {
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

          // @ts-ignore
          return collectionData.map((v, i) => {
            totalJoins += joins[i].length;
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
