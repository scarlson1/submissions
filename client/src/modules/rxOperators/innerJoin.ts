import { Firestore, query, where, limit, collection } from 'firebase/firestore';
import { collectionData as rxCollectionData } from 'rxfire/firestore';
import { combineLatest, defer, map, of, switchMap, tap } from 'rxjs';

// REQUIRES SAME DOCUMENT FIELD IN BOTH DOCUMENTS/COLLECTION
// EXAMPLE
// user = { userId: '123', ...rest }
// policy = { userId: '123', ...rest }
// --> returns: { ...user, [collectionName]: [ ...docsWithMatchingUserId ]}

/**
 * Joins docs from another collection with saved field:value
 * @param {Firestore} firestore - firestore instance
 * @param {string} field - field present on doc and used to match on populate collection
 * @param {string} collName - name of the collection to search
 * @param {number} joinlimit - max # of object to join with parent doc
 * @returns {Observable<unknown>} - combined observable of parent documents with a field using the collection name as the key and an array of any documents in the collection matching the field:value from the parent
 */

export const innerJoin = (
  firestore: Firestore,
  field: string,
  coll: { root: string; pathSegments?: string[] },
  joinlimit = 100 // limits # of objects that get joined in parent query
) => {
  return (source: any) =>
    defer(() => {
      // defer creates state on a per subscription basis
      // OPERATOR STATE
      let collectionData: any;

      let totalJoins = 0;

      return source.pipe(
        switchMap((data) => {
          // Clear mapping on each emitted val

          // Save the parent data state
          collectionData = data as any[];

          if (!data || collectionData.length === 0) return of(data);

          const reads$ = [];
          for (const doc of collectionData) {
            // Push doc read to Array
            // Only get docs where shared key:value pair in both collections
            if (doc[field]) {
              // Perform query to join key, with optional limit
              // const collectionRef = collection(firestore, collName, ...pathSements);
              const collectionRef = collection(firestore, coll.root, ...(coll.pathSegments || []));
              const q = query(collectionRef, where(field, '==', doc[field]), limit(joinlimit));

              // reads$.push(rxCollection(q));
              reads$.push(rxCollectionData(q));

              // Firestore v8
              // const q = ref => ref.where(field, '==', doc[field])
              // reads$.push(firestore.collection(collection,q))
            } else {
              reads$.push(of([]));
            }
          }

          return combineLatest(reads$);
        }),
        map((joins: any[]) => {
          // @ts-ignore
          return collectionData.map((v, i) => {
            totalJoins += joins[i].length;
            return { ...v, [coll.root]: joins[i] || null };
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
