import { CollectionReference, DocumentData, Firestore } from 'firebase-admin/firestore';

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

const createCollection = <T = DocumentData>(db: Firestore, collectionPath: Collection | string) => {
  return db.collection(collectionPath) as CollectionReference<T>;
};

export const taxesCollection = (db: Firestore) => createCollection<Tax>(db, 'taxes');

export const moratoriumsCollection = (db: Firestore) =>
  createCollection<Moratorium>(db, 'moratoriums');

export const usersCollection = (db: Firestore) => createCollection<User>(db, 'users');

export const orgsCollection = (db: Firestore) =>
  createCollection<Organization>(db, 'organizations');

export const submissionsCollection = (db: Firestore) =>
  createCollection<Submission>(db, 'submissions');

export const quotesCollection = (db: Firestore) => createCollection<Quote>(db, 'quotes');

export const policiesCollection = (db: Firestore) => createCollection<Policy>(db, 'policies');

export const locationsCollection = (db: Firestore) => createCollection<ILocation>(db, 'locations');

export const ratingDataCollection = (db: Firestore) =>
  createCollection<RatingData>(db, 'ratingData');

export const taxCalcCollection = (db: Firestore) =>
  createCollection<TaxCalc>(db, Collection.Enum.taxCalculations);

export const taxTransactionsCollection = <T = TaxTransaction>(db: Firestore) =>
  createCollection<T>(db, Collection.Enum.taxTransactions);

export const licensesCollection = (db: Firestore) => createCollection<License>(db, 'licenses');

export const swissReResCollection = (db: Firestore) =>
  createCollection<SRResWithAAL | SRRes>(db, 'swissReRes');

// export const secureCollection = <T = DocumentData>(db: Firestore) =>
//   createCollection<T>(db, 'secure');

// sub collections

export const versionsCollection = <T extends DocumentData>(
  db: Firestore,
  parentCollection: Collection,
  parentId: string
) => createCollection<T>(db, `${parentCollection}/${parentId}/${Collection.Enum.versions}`);

export const invitesCollection = (db: Firestore, orgId: string) =>
  createCollection<Invite>(
    db,
    `${Collection.Enum.organizations}/${orgId}/${Collection.Enum.invitations}`
  );

const userAccessCollection = (db: Firestore, userId: string) =>
  createCollection<UserAccess>(
    db,
    `${Collection.Enum.users}/${userId}/${Collection.Enum.permissions}`
  );

export const getUserAccessRef = (db: Firestore, userId: string) =>
  userAccessCollection(db, userId).doc('private');

// export const securePolicyCollection = <T>(db: Firestore, policyId: string) =>
//   createCollection<T>(db, `${Collection.Enum.policies}/${policyId}/${Collection.Enum.secure}`);

// export const getPrivilegedPolicyRef = (db: Firestore, policyId: string) =>
//   securePolicyCollection<PrivilegedPolicyData>(db, policyId).doc('rating');
