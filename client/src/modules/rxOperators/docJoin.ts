// fireship - custom rxjs operators: https://fireship.io/lessons/custom-rxjs-operators-by-example/

// fireship - custom joins: https://fireship.io/lessons/firestore-joins-similar-to-sql/

import { Firestore, doc } from 'firebase/firestore';
import { docData } from 'rxfire/firestore';
import { combineLatest, defer, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// works like populate in mongoose

// EXAMPLE:
// paths = {
//   [feildKey1]: [collectionName1],
//   [fieldKey2]: [collectionName2]
// }
// --> use key1 to search collection1
// --> use key2 to search collection2

// --> pet is key with relational data
// --> 'pets' is the collection to search for related data

// USAGE

// firestore.doc('users/jeff')
//   .valueChanges
//   .pipe(
//     docJoin(firestore, { pet: 'pets', car: 'cars' })
//   )

// TODO: typings
// CUSTOM RXJS OPERATOR (FIRESHIP VIDEO ^^)
// export const docJoin = <TBase = any, JoinTypes = { [key: string]: any }>(
export const docJoin = (
  firestore: Firestore,
  // paths: { [Property in keyof JoinTypes]: string }
  paths: { [key: string]: string } // each key is key on doc that points to collection to find the related document
) => {
  return (source: any) =>
    defer(() => {
      // defer creates state on a per subscription basis
      let parent: any;
      const keys = Object.keys(paths);

      return source.pipe(
        // tap((v) => console.log('SOURCE: ', v)),
        switchMap((data: any) => {
          console.log('docJoin PARENT DATA: ', data);
          // Save the parent data state
          parent = data;

          if (!data || data.length === 0) return of(data);

          // Map each path to an Observable
          const docs$ = keys.map((k) => {
            // const fullPath = `${paths[k]}/${parent[k]}}`; // collection/valueFromDoc

            // paths[k] is collection to search, parent[k] is the doc ID ??
            const ref = doc(firestore, paths[k], parent[k]);
            // const ref = doc(firestore, 'users', parent['userId']);
            return docData(ref, { idField: `_${k}` }); // firestore.doc(fullPath).valueChanges();
          });

          // Return combineLatest (waits for all reads to finish)
          return combineLatest(docs$); // combineLatest deprecated
        }),
        map((arr: any[]) => {
          console.log('docJoin ARR: ', arr);
          // TODO: return empty arr ?? or undefined ??
          if (!arr || !arr.length) {
            if (parent) return { ...parent };
            return undefined; // null
          }
          // Combine parent document with relational documents
          const joins = keys.reduce((acc, cur, index) => {
            console.log('docJoin CURRENT KEY: ', cur);
            return { ...acc, [cur]: arr[index] };
          }, {}); // [`${paths[cur]}:${cur}`]

          // Return the parent doc with the joined objects
          return { ...parent, ...joins };
        })
      );
    });
};
