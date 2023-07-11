import { DocumentData, CollectionReference, Firestore } from 'firebase-admin/firestore';

import {
  AgencyApplication,
  Charge,
  COLLECTIONS,
  PolicyOld,
  RatingData,
  Quote,
  Transaction,
  PropertyDataRes,
  Submission,
  User,
  SRRes,
  SRResWithAAL,
  Organization,
  Invite,
  PaymentMethod,
  Policy,
  License,
  Moratorium,
} from '../common'; // AgencyApplication, Invite, Notification, Organization,
import { ClaimsDocData } from '../firestoreEvents/index.js';

export const createCollection = <T = DocumentData>(db: Firestore, collectionName: string) => {
  return db.collection(collectionName) as CollectionReference<T>;
};

export const usersCollection = (db: Firestore) => createCollection<User>(db, COLLECTIONS.USERS);

export const orgsCollection = (db: Firestore) =>
  createCollection<Organization>(db, COLLECTIONS.ORGANIZATIONS);

export const submissionsCollection = (db: Firestore) =>
  createCollection<Submission>(db, COLLECTIONS.SUBMISSIONS);

export const ratingDataCollection = (db: Firestore) =>
  createCollection<RatingData>(db, COLLECTIONS.RATING_DATA);

export const quotesCollection = (db: Firestore) => createCollection<Quote>(db, COLLECTIONS.QUOTES);

export const propertyDataResCollection = (db: Firestore) =>
  createCollection<PropertyDataRes>(db, COLLECTIONS.PROPERTY_DATA_RES);

export const finTrxCollection = (db: Firestore) =>
  createCollection<Charge>(db, COLLECTIONS.FIN_TRANSACTIONS);

export const policiesCollectionOld = (db: Firestore) =>
  createCollection<PolicyOld>(db, COLLECTIONS.POLICIES);

export const policiesCollection = (db: Firestore) =>
  createCollection<Policy>(db, COLLECTIONS.POLICIES);

export const transactionsCollection = (db: Firestore) =>
  createCollection<Transaction>(db, COLLECTIONS.TRANSACTIONS);

export const swissReResCollection = (db: Firestore) =>
  createCollection<SRResWithAAL | SRRes>(db, COLLECTIONS.SR_RES);

export const agencyApplicationCollection = (db: Firestore) =>
  createCollection<AgencyApplication>(db, COLLECTIONS.AGENCY_APPLICATIONS);

export const licensesCollection = (db: Firestore) =>
  createCollection<License>(db, COLLECTIONS.LICENSES);

export const emailActivityCollection = (db: Firestore) =>
  createCollection<any>(db, COLLECTIONS.EMAIL_ACTIVITY);

export const moratoriumsCollection = (db: Firestore) =>
  createCollection<Moratorium>(db, COLLECTIONS.MORATORIUMS);

// // SUBCOLLECTIONS
// export const notificationsCollection = (db: Firestore, userId: string) =>
//   createCollection<Notification>(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.NOTIFICATIONS}`);

export const invitesCollection = (db: Firestore, orgId: string) =>
  createCollection<Invite>(db, `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.INVITES}`);

export const userClaimsCollection = (db: Firestore, orgId: string) =>
  createCollection<ClaimsDocData>(
    db,
    `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.USER_CLAIMS}`
  );

export const paymentMethodsCollection = (db: Firestore, userId: string) =>
  createCollection<PaymentMethod>(
    db,
    `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.PAYMENT_METHODS}`
  );
