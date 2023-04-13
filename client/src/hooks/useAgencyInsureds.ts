import { collectionData, doc, docData, fromRef } from 'rxfire/firestore';
import { DocumentData, Query as FirestoreQuery } from 'firebase/firestore';
import {
  ObservableStatus,
  ReactFireOptions,
  checkIdField,
  useObservable,
  // getUniqueIdForFirestoreQuery,
} from 'reactfire';

/**
 * Subscribe to a Firestore collection and unwrap the snapshot into an array.
 */
export function useFirestoreCollectionData<T = DocumentData>(
  query: FirestoreQuery<T>,
  options?: ReactFireOptions<T[]>
): ObservableStatus<T[]> {
  const idField = options ? checkIdField(options) : 'NO_ID_FIELD';
  const observableId = `firestore:collectionData:${getUniqueIdForFirestoreQuery(
    query
  )}:idField=${idField}`;
  const observable$ = collectionData(query, { idField });

  return useObservable(observableId, observable$, options);
}

// /**
//  * Combine observable depending on the first observable
//  * Suscribe to Firestore Document changes and unwrap the document into a plain object
//  */
// export function useAgencyInsureds<T = unknown>(
//   ref: DocumentReference<T>,
//   options?: ReactFireOptions<T>
// ): ObservableStatus<T> {
//   const idField = options ? checkIdField(options) : 'NO_ID_FIELD';

//   const observableId = `firestore:docData:${ref.firestore.app.name}:${ref.path}:idField=${idField}`;
//   const observable = docData(ref, { idField });

//   return useObservable(observableId, observable, options);
// }
