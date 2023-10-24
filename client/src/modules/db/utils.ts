import { customAlphabet } from 'nanoid';

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const nanoId = customAlphabet(ALPHABET, 9);

export const createDocId = nanoId;

// TODO: finish getInequalityFilterFields to using in server grid sort

// import { FieldPath, Query } from 'firebase/firestore';
// import { SortedSet } from 'modules/utils';

// // REF: https://github.com/firebase/firebase-js-sdk/blob/master/packages/firestore/src/core/query.ts#L177

// // used by queryNormalizedOrderBy: https://github.com/firebase/firebase-js-sdk/blob/master/packages/firestore/src/core/query.ts#L249

// // Returns the sorted set of inequality filter fields used in this query.
// export function getInequalityFilterFields(query: Query): SortedSet<FieldPath> {
//   // let result = new SortedSet<FieldPath>(FieldPath.comparator);
//   let result = new SortedSet<FieldPath>(FieldPath.comparator);

//   query.filters.forEach((filter: Filter) => {
//     const subFilters = filter.getFlattenedFilters();
//     subFilters.forEach((filter: FieldFilter) => {
//       if (filter.isInequality()) {
//         result = result.add(filter.field);
//       }
//     });
//   });

//   return result;
// }
