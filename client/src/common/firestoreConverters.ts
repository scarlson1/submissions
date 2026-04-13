import {
  DocumentData,
  PartialWithFieldValue,
  QueryDocumentSnapshot,
  SnapshotOptions,
  Timestamp,
  WithFieldValue,
} from 'firebase/firestore';

import type { Quote, WithId } from '@idemand/common';

export const quoteConverter = {
  toFirestore(
    submission: PartialWithFieldValue<Quote> | WithFieldValue<Quote>,
  ): DocumentData {
    return { ...submission, 'metadata.updated': Timestamp.now() };
  },
  fromFirestore(
    snap: QueryDocumentSnapshot<Quote>,
    options: SnapshotOptions,
  ): WithId<Quote> {
    const data = snap.data(options)!;

    return { ...data, id: snap.id };
  },
};

//  | UpdateData<WithId<T>>
export const withIdConverter = <T>() => ({
  toFirestore(data: PartialWithFieldValue<WithId<T>>): DocumentData {
    if (typeof data === 'object' && data?.id) delete data.id;
    let temp = data || {};
    return { ...temp, 'metadata.updated': Timestamp.now() };
  },
  fromFirestore(
    snap: QueryDocumentSnapshot<T>,
    options: SnapshotOptions,
  ): WithId<T> {
    const data = snap.data(options)!;

    return { ...data, id: snap.id } as WithId<T>;
  },
});

// https://github.com/googleapis/nodejs-firestore/issues/1448

// fixes nested obj typescript error
// const test: CustomUpdateData<Submission> = {
//   status: updateValues.status,
//   'metadata.updated': Timestamp.now(),
// };

type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? T[K] extends ArrayLike<any>
      ? K | `${K}.${PathImpl<T[K], Exclude<keyof T[K], keyof any[]>>}`
      : K | `${K}.${PathImpl<T[K], keyof T[K]>}`
    : K
  : never;

type Path<T> = PathImpl<T, keyof T> | keyof T;

type PathValue<T, P extends Path<T>> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Rest extends Path<T[K]>
      ? PathValue<T[K], Rest>
      : never
    : never
  : P extends keyof T
    ? T[P]
    : never;

export type CustomUpdateData<T extends object> = Partial<{
  [TKey in Path<T>]: PathValue<T, TKey>;
}>;

// EXAMPLE: https://firebase.google.com/docs/reference/js/firestore_.firestoredataconverter

// class Post {
//   constructor(readonly title: string, readonly author: string) {}

//   toString(): string {
//     return this.title + ', by ' + this.author;
//   }
// }

// const postConverter = {
//   toFirestore(post: WithFieldValue<Post>): DocumentData {
//     return { title: post.title, author: post.author };
//   },
//   fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Post {
//     const data = snapshot.data(options)!;
//     return new Post(data.title, data.author);
//   },
// };

// const postSnap = await firebase
//   .firestore()
//   .collection('posts')
//   .withConverter(postConverter)
//   .doc()
//   .get();
// const post = postSnap.data();
// if (post !== undefined) {
//   post.title; // string
//   post.toString(); // Should be defined
//   post.someNonExistentProperty; // TS error
// }
