import {
  CollectionReference,
  DocumentData,
  Firestore,
} from 'firebase-admin/firestore';

import { Collection } from './enums.js';
import {
  ILocation,
  Invite,
  License,
  Moratorium,
  Organization,
  Policy,
  Quote,
  RatingData,
  SRRes,
  SRResWithAAL,
  Submission,
  Tax,
  TaxCalc,
  TaxTransaction,
  User,
  UserAccess,
} from './types/index.js';

const createCollection = <T = DocumentData>(
  db: Firestore,
  collectionPath: Collection | string,
) => {
  return db.collection(collectionPath) as CollectionReference<T>;
};

export const taxesCollection = (db: Firestore) =>
  createCollection<Tax>(db, Collection.enum.taxes);

export const moratoriumsCollection = (db: Firestore) =>
  createCollection<Moratorium>(db, Collection.enum.moratoriums);

export const usersCollection = (db: Firestore) =>
  createCollection<User>(db, Collection.enum.users);

export const orgsCollection = (db: Firestore) =>
  createCollection<Organization>(db, Collection.enum.organizations);

export const submissionsCollection = (db: Firestore) =>
  createCollection<Submission>(db, Collection.enum.submissions);

export const quotesCollection = (db: Firestore) =>
  createCollection<Quote>(db, Collection.enum.quotes);

export const policiesCollection = (db: Firestore) =>
  createCollection<Policy>(db, Collection.enum.policies);

export const locationsCollection = (db: Firestore) =>
  createCollection<ILocation>(db, Collection.enum.locations);

export const ratingDataCollection = (db: Firestore) =>
  createCollection<RatingData>(db, Collection.enum.ratingData);

export const taxCalcCollection = (db: Firestore) =>
  createCollection<TaxCalc>(db, Collection.Enum.taxCalculations);

export const taxTransactionsCollection = <T = TaxTransaction>(db: Firestore) =>
  createCollection<T>(db, Collection.Enum.taxTransactions);

export const licensesCollection = (db: Firestore) =>
  createCollection<License>(db, Collection.enum.licenses);

export const swissReResCollection = (db: Firestore) =>
  createCollection<SRResWithAAL | SRRes>(db, Collection.enum.swissReRes);

// export const secureCollection = <T = DocumentData>(db: Firestore) =>
//   createCollection<T>(db, 'secure');

export const activeStates = (db: Firestore) =>
  createCollection(db, Collection.enum.states);

// sub collections

export const versionsCollection = <T extends DocumentData>(
  db: Firestore,
  parentCollection: Collection,
  parentId: string,
) =>
  createCollection<T>(
    db,
    `${parentCollection}/${parentId}/${Collection.Enum.versions}`,
  );

export const invitesCollection = (db: Firestore, orgId: string) =>
  createCollection<Invite>(
    db,
    `${Collection.Enum.organizations}/${orgId}/${Collection.Enum.invitations}`,
  );

const userAccessCollection = (db: Firestore, userId: string) =>
  createCollection<UserAccess>(
    db,
    `${Collection.Enum.users}/${userId}/${Collection.Enum.permissions}`,
  );

export const getUserAccessRef = (db: Firestore, userId: string) =>
  userAccessCollection(db, userId).doc('private');

// export const securePolicyCollection = <T>(db: Firestore, policyId: string) =>
//   createCollection<T>(db, `${Collection.Enum.policies}/${policyId}/${Collection.Enum.secure}`);

// export const getPrivilegedPolicyRef = (db: Firestore, policyId: string) =>
//   securePolicyCollection<PrivilegedPolicyData>(db, policyId).doc('rating');
