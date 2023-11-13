import { CollectionReference, DocumentData, Firestore } from 'firebase-admin/firestore';

import {
  AgencyApplication,
  // COLLECTIONS,
  ChangeRequest,
  Charge,
  // Collection,
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
  Collection,
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

export const createCollection = <T = DocumentData>(
  db: Firestore,
  collectionName: Collection | string
) => {
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
  createCollection<RatingData>(db, 'ratingData');

// export const quotesCollection = (db: Firestore) => createCollection<Quote>(db, COLLECTIONS.QUOTES);

export const propertyDataResCollection = (db: Firestore) =>
  createCollection<PropertyDataRes>(db, 'propertyDataRes');

export const finTrxCollection = (db: Firestore) =>
  createCollection<Charge>(db, 'financialTransactions');

// export const policiesCollection = (db: Firestore) =>
//   createCollection<Policy>(db, COLLECTIONS.POLICIES);

export const policyClaimsCollection = (db: Firestore, policyId: string) =>
  createCollection<PolicyClaim>(
    db,
    `${Collection.enum.policies}/${policyId}/${Collection.enum.claims}`
  );

export const transactionsCollection = (db: Firestore) =>
  createCollection<Transaction>(db, 'transactions');

export const swissReResCollection = (db: Firestore) =>
  createCollection<SRResWithAAL | SRRes>(db, 'swissReRes');

export const agencyApplicationCollection = (db: Firestore) =>
  createCollection<AgencyApplication>(db, 'agencySubmissions');

// export const licensesCollection = (db: Firestore) =>
//   createCollection<License>(db, COLLECTIONS.LICENSES);

export const emailActivityCollection = (db: Firestore) =>
  createCollection<any>(db, 'emailActivity');

// export const moratoriumsCollection = (db: Firestore) =>
//   createCollection<Moratorium>(db, COLLECTIONS.MORATORIUMS);

export const disclosuresCollection = (db: Firestore) =>
  createCollection<Disclosure>(db, 'disclosures');

export const importSummaryCollection = (db: Firestore) =>
  createCollection<ImportSummary>(db, 'dataImports');

// // SUB-COLLECTIONS
// export const notificationsCollection = (db: Firestore, userId: string) =>
//   createCollection<Notification>(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.NOTIFICATIONS}`);

export const invitesCollection = (db: Firestore, orgId: string) =>
  createCollection<Invite>(
    db,
    `${Collection.enum.organizations}/${orgId}/${Collection.enum.invitations}`
  );

export const userClaimsCollection = (db: Firestore, orgId: string) =>
  createCollection<ClaimsDocData>(
    db,
    `${Collection.enum.userClaims}/${orgId}/${Collection.enum.userClaims}`
  );

export const paymentMethodsCollection = (db: Firestore, userId: string) =>
  createCollection<PaymentMethod>(
    db,
    `${Collection.enum.users}/${userId}/${Collection.enum.paymentMethods}`
  );

export const changeRequestsCollection = <T extends ChangeRequest = ChangeRequest>(
  db: Firestore,
  policyId: string
) =>
  createCollection<T>(
    db,
    `${Collection.enum.policies}/${policyId}/${Collection.enum.changeRequests}`
  );

export const stagedImportsCollection = (db: Firestore, importId: string) =>
  createCollection<StageImportRecord>(
    db,
    `${Collection.enum.dataImports}/${importId}/${Collection.enum.stagedDocs}`
  );

export const versionsCollection = <T extends DocumentData>(
  db: Firestore,
  parentCollection: Collection, // keyof typeof COLLECTIONS,
  parentId: string
) => createCollection<T>(db, `${parentCollection}/${parentId}/${Collection.enum.versions}`);
