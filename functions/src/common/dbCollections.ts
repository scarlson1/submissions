import { CollectionReference, DocumentData, Firestore } from 'firebase-admin/firestore';

import {
  AgencyApplication,
  COLLECTIONS,
  ChangeRequest,
  Charge,
  Collection,
  Disclosure,
  ImportSummary,
  Invite,
  PaymentMethod,
  PolicyClaim,
  PropertyDataRes,
  RatingData,
  SRRes,
  SRResWithAAL,
  StageImportRecord,
  Transaction,
} from '../common/index.js';
import { ClaimsDocData } from '../firestoreEvents/index.js';

import {
  licensesCollection,
  locationsCollection,
  moratoriumsCollection,
  orgsCollection,
  policiesCollection,
  quotesCollection,
  submissionsCollection,
  taxesCollection,
  usersCollection,
} from '@idemand/common';

export {
  licensesCollection,
  locationsCollection,
  moratoriumsCollection,
  orgsCollection,
  policiesCollection,
  quotesCollection,
  submissionsCollection,
  taxesCollection,
  usersCollection,
};

// TODO: convert to "...string[]" instead of template literal

export const createCollection = <T = DocumentData>(db: Firestore, collectionName: string) => {
  return db.collection(collectionName) as CollectionReference<T>;
};

// export const usersCollection = (db: Firestore) => createCollection<User>(db, COLLECTIONS.USERS);

// export const orgsCollection = (db: Firestore) =>
//   createCollection<Organization>(db, COLLECTIONS.ORGANIZATIONS);

// export const submissionsCollection = (db: Firestore) =>
//   createCollection<Submission>(db, COLLECTIONS.SUBMISSIONS);

// export const locationsCollection = (db: Firestore) =>
//   createCollection<ILocation>(db, COLLECTIONS.LOCATIONS);

export const ratingDataCollection = (db: Firestore) =>
  createCollection<RatingData>(db, COLLECTIONS.RATING_DATA);

// export const quotesCollection = (db: Firestore) => createCollection<Quote>(db, COLLECTIONS.QUOTES);

export const propertyDataResCollection = (db: Firestore) =>
  createCollection<PropertyDataRes>(db, COLLECTIONS.PROPERTY_DATA_RES);

export const finTrxCollection = (db: Firestore) =>
  createCollection<Charge>(db, COLLECTIONS.FIN_TRANSACTIONS);

// export const policiesCollection = (db: Firestore) =>
//   createCollection<Policy>(db, COLLECTIONS.POLICIES);

export const policyClaimsCollection = (db: Firestore, policyId: string) =>
  createCollection<PolicyClaim>(db, `${COLLECTIONS.POLICIES}/${policyId}/${COLLECTIONS.CLAIMS}`);

export const transactionsCollection = (db: Firestore) =>
  createCollection<Transaction>(db, COLLECTIONS.TRANSACTIONS);

export const swissReResCollection = (db: Firestore) =>
  createCollection<SRResWithAAL | SRRes>(db, COLLECTIONS.SR_RES);

export const agencyApplicationCollection = (db: Firestore) =>
  createCollection<AgencyApplication>(db, COLLECTIONS.AGENCY_APPLICATIONS);

// export const licensesCollection = (db: Firestore) =>
//   createCollection<License>(db, COLLECTIONS.LICENSES);

export const emailActivityCollection = (db: Firestore) =>
  createCollection<any>(db, COLLECTIONS.EMAIL_ACTIVITY);

// export const moratoriumsCollection = (db: Firestore) =>
//   createCollection<Moratorium>(db, COLLECTIONS.MORATORIUMS);

export const disclosuresCollection = (db: Firestore) =>
  createCollection<Disclosure>(db, COLLECTIONS.DISCLOSURES);

export const importSummaryCollection = (db: Firestore) =>
  createCollection<ImportSummary>(db, COLLECTIONS.DATA_IMPORTS);

// // SUB-COLLECTIONS
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

export const changeRequestsCollection = <T extends ChangeRequest = ChangeRequest>(
  db: Firestore,
  policyId: string
) => createCollection<T>(db, `${COLLECTIONS.POLICIES}/${policyId}/${COLLECTIONS.CHANGE_REQUESTS}`);

export const stagedImportsCollection = (db: Firestore, importId: string) =>
  createCollection<StageImportRecord>(
    db,
    `${COLLECTIONS.DATA_IMPORTS}/${importId}/${COLLECTIONS.STAGED_RECORDS}`
  );

export const versionsCollection = <T extends DocumentData>(
  db: Firestore,
  parentCollection: Collection, // keyof typeof COLLECTIONS,
  parentId: string
) => createCollection<T>(db, `${parentCollection}/${parentId}/${COLLECTIONS.VERSIONS}`);
