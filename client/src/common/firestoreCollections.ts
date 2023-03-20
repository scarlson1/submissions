import { collection, CollectionReference, DocumentData, Firestore } from 'firebase/firestore';

import { COLLECTIONS } from './enums';
import {
  QuoteData,
  RatingData,
  SpatialKeyResponse,
  Organization,
  Policy,
  User,
  UserClaims,
  Invite,
  License,
  Submission,
  NotifyRegistration,
  Tax,
  Moratorium,
  AgencyApplication,
  ActiveStates,
  SubmissionQuoteData,
  PaymentMethod,
  Charge,
} from './types';
// // import { db } from 'firebaseConfig';
// import { getFirestore } from 'firebase/firestore';

// export const createCollection = <T = DocumentData>(collectionName: string, ...rest: string[]) => {
//   return collection(getFirestore(), collectionName, ...rest) as CollectionReference<T>;
// };

// export const submissionsCollection = createCollection<Submission>(COLLECTIONS.SUBMISSIONS);
// export const quotesCollection = createCollection<QuoteData>(COLLECTIONS.QUOTES);
// export const submissionsQuotesCollection = createCollection<SubmissionQuoteData>(
//   COLLECTIONS.SUBMISSIONS_QUOTES
// );
// export const ratingCollection = createCollection<RatingData>(COLLECTIONS.RATING_DATA);
// export const spatialKeyCollection = createCollection<SpatialKeyResponse>(COLLECTIONS.SK_RES);
// export const orgsCollection = createCollection<Organization>(COLLECTIONS.ORGANIZATIONS);
// export const policiesCollection = createCollection<Policy>(COLLECTIONS.POLICIES);
// // export const policiesTempCollection = createCollection<Policy>(COLLECTIONS.POLICIES_TEMP);
// export const usersCollection = createCollection<User>(COLLECTIONS.USERS);
// export const licensesCollection = createCollection<License>(COLLECTIONS.LICENSES);
// export const notifyRegistration = createCollection<NotifyRegistration>(
//   COLLECTIONS.NOTIFY_REGISTRATION
// );
// export const taxesCollection = createCollection<Tax>(COLLECTIONS.TAXES);
// export const statesCollection = createCollection<ActiveStates>(COLLECTIONS.ACTIVE_STATES);
// export const moratoriumsCollection = createCollection<Moratorium>(COLLECTIONS.MORATORIUMS);
// export const agencyAppCollection = createCollection<AgencyApplication>(
//   COLLECTIONS.AGENCY_APPLICATIONS
// );
// export const transactionsCollection = createCollection<Charge>(COLLECTIONS.TRANSACTIONS);

// // SUB COLLECTIONS
// export const userClaimsCollection = (orgId: string) =>
//   createCollection<UserClaims>(COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.USER_CLAIMS);
// export const invitesCollection = (orgId: string, ...rest: any) =>
//   createCollection<Invite>(COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.INVITES, ...rest);
// export const paymentMethodsCollection = (userId: string, ...rest: any) =>
//   createCollection<PaymentMethod>(COLLECTIONS.USERS, userId, COLLECTIONS.PAYMENT_METHODS, ...rest);
// // export const notificationsCollection = (userId: string) =>
// //   createCollection<Notification>(COLLECTIONS.USERS, userId, COLLECTIONS.NOTIFICATIONS);
// // export const licensesCollection = (orgId: string) =>
// // createCollection<License>(COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.LICENSES);

// REACT FIRE
export const createCollection = <T = DocumentData>(
  db: Firestore,
  collectionName: string,
  ...rest: string[]
) => {
  return collection(db, collectionName, ...rest) as CollectionReference<T>;
};
export const submissionsCollection = (db: Firestore) =>
  createCollection<Submission>(db, COLLECTIONS.SUBMISSIONS);

export const quotesCollection = (db: Firestore) =>
  createCollection<QuoteData>(db, COLLECTIONS.QUOTES);
export const submissionsQuotesCollection = (db: Firestore) =>
  createCollection<SubmissionQuoteData>(db, COLLECTIONS.SUBMISSIONS_QUOTES);
export const ratingCollection = (db: Firestore) =>
  createCollection<RatingData>(db, COLLECTIONS.RATING_DATA);
export const spatialKeyCollection = (db: Firestore) =>
  createCollection<SpatialKeyResponse>(db, COLLECTIONS.SK_RES);
export const orgsCollection = (db: Firestore) =>
  createCollection<Organization>(db, COLLECTIONS.ORGANIZATIONS);
export const policiesCollection = (db: Firestore) =>
  createCollection<Policy>(db, COLLECTIONS.POLICIES);
// export const policiesTempCollection = createCollection<Policy>(COLLECTIONS.POLICIES_TEMP);
export const usersCollection = (db: Firestore) => createCollection<User>(db, COLLECTIONS.USERS);
export const licensesCollection = (db: Firestore) =>
  createCollection<License>(db, COLLECTIONS.LICENSES);
export const notifyRegistration = (db: Firestore) =>
  createCollection<NotifyRegistration>(db, COLLECTIONS.NOTIFY_REGISTRATION);
export const taxesCollection = (db: Firestore) => createCollection<Tax>(db, COLLECTIONS.TAXES);
export const statesCollection = (db: Firestore) =>
  createCollection<ActiveStates>(db, COLLECTIONS.ACTIVE_STATES);
export const moratoriumsCollection = (db: Firestore) =>
  createCollection<Moratorium>(db, COLLECTIONS.MORATORIUMS);
export const agencyAppCollection = (db: Firestore) =>
  createCollection<AgencyApplication>(db, COLLECTIONS.AGENCY_APPLICATIONS);
export const transactionsCollection = (db: Firestore) =>
  createCollection<Charge>(db, COLLECTIONS.TRANSACTIONS);

// SUB COLLECTIONS
export const userClaimsCollection = (db: Firestore, orgId: string) =>
  createCollection<UserClaims>(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.USER_CLAIMS);
export const invitesCollection = (db: Firestore, orgId: string, ...rest: any) =>
  createCollection<Invite>(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.INVITES, ...rest);
export const paymentMethodsCollection = (db: Firestore, userId: string, ...rest: any) =>
  createCollection<PaymentMethod>(
    db,
    COLLECTIONS.USERS,
    userId,
    COLLECTIONS.PAYMENT_METHODS,
    ...rest
  );
// export const notificationsCollection = (userId: string) =>
//   createCollection<Notification>(COLLECTIONS.USERS, userId, COLLECTIONS.NOTIFICATIONS);
// export const licensesCollection = (orgId: string) =>
// createCollection<License>(COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.LICENSES);
