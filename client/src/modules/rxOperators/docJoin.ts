// fireship - custom rxjs operators: https://fireship.io/lessons/custom-rxjs-operators-by-example/

// fireship - custom joins: https://fireship.io/lessons/firestore-joins-similar-to-sql/

import { Firestore, doc } from 'firebase/firestore';
import { docData } from 'rxfire/firestore';
import { combineLatest, defer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// works like populate in mongoose ??

// EXAMPLE:
// paths = {
//   [feildKey1]: [collectionName1],
//   [fieldKey2]: [collectionName2]
// }
// --> use key1 to search collection1
// --> use key2 to search collection2

// USAGE

// firestore.doc('users/jeff')
//   .valueChanges
//   .pipe(
//     docJoin(firestore, { pet: 'pets', car: 'cars' })
//   )

// --> pet is key with relational data
// --> 'pets' is the collection to search for related data

// CUSTOM RXJS OPERATOR (FIRESHIP VIDEO ^^)
export const docJoin = (
  firestore: Firestore,
  paths: { [key: string]: string } // each key is key on doc that points to collection to find the related document
) => {
  return (source: any) =>
    defer(() => {
      let parent: any; // defer creates state on a per subscription basis
      const keys = Object.keys(paths);

      return source.pipe(
        // tap((v) => console.log('SOURCE: ', v)),
        switchMap((data) => {
          console.log('PARENT DATA: ', data);
          // Save the parent data state
          parent = data;

          // Map each path to an Observable
          const docs$ = keys.map((k) => {
            // const fullPath = `${paths[k]}/${parent[k]}}`; // collection/valueFromDoc

            const ref = doc(firestore, paths[k], parent[k]);
            // const ref = doc(firestore, 'users', parent['userId']);
            return docData(ref, { idField: `_${k}` }); // firestore.doc(fullPath).valueChanges();
          });

          // Return combineLatest (waits for all reads to finish)
          return combineLatest(docs$); // combineLatest deprecated
        }),
        map((arr: any[]) => {
          console.log('ARR: ', arr);
          // Combine parent document with relational documents
          const joins = keys.reduce((acc, cur, index) => {
            console.log('CURRENT KEY: ', cur);
            return { ...acc, [cur]: arr[index] };
          }, {}); // [`${paths[cur]}:${cur}`]

          // Return the parent doc with the joined objects
          return { ...parent, ...joins };
        })
      );
    });
};
