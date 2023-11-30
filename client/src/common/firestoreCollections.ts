import { collection, CollectionReference, DocumentData, Firestore } from 'firebase/firestore';

import { Collection, TCollection } from './enums';
import {
  ActiveStates,
  AgencyApplication,
  ChangeRequest,
  Charge,
  DraftPolicyClaim,
  ILocation,
  ImportSummary,
  Invite,
  License,
  Moratorium,
  NotifyRegistration,
  Organization,
  Payable,
  PaymentMethod,
  Policy,
  PolicyClaim,
  PortfolioSubmission,
  PropertyDataRes,
  Quote,
  RatingData,
  StageImportRecord,
  Submission,
  TaxTransaction,
  TTax,
  User,
  UserAccess,
  UserClaims,
} from './types';

export const createCollection = <T = DocumentData, U extends DocumentData = DocumentData>(
  db: Firestore,
  collectionName: TCollection,
  ...rest: string[]
) => {
  return collection(db, collectionName, ...rest) as CollectionReference<T, U>;
};

export const submissionsCollection = (db: Firestore) =>
  createCollection<Submission, Submission>(db, 'submissions');

export const portfolioSubmissionsCollection = (db: Firestore) =>
  createCollection<PortfolioSubmission, PortfolioSubmission>(db, 'portfolioSubmissions');

export const locationsCollection = (db: Firestore) =>
  createCollection<ILocation, ILocation>(db, 'locations');

// TODO: change to quotes instead of submission quotes
export const quotesCollection = (db: Firestore) => createCollection<Quote>(db, 'quotes');

export const ratingCollection = (db: Firestore) =>
  createCollection<RatingData, RatingData>(db, 'ratingData');

export const propertyDataResCollection = (db: Firestore) =>
  createCollection<PropertyDataRes, PropertyDataRes>(db, 'propertyDataRes');

export const orgsCollection = (db: Firestore) =>
  createCollection<Organization, Organization>(db, 'organizations');

export const policiesCollection = (db: Firestore) =>
  createCollection<Policy, Policy>(db, 'policies');

export const payablesCollection = (db: Firestore) =>
  createCollection<Payable, Payable>(db, 'payables');

export const usersCollection = (db: Firestore) => createCollection<User, User>(db, 'users');

export const licensesCollection = (db: Firestore) =>
  createCollection<License, License>(db, 'licenses');

export const notifyRegistration = (db: Firestore) =>
  createCollection<NotifyRegistration, NotifyRegistration>(db, 'notifyRegistration');

export const taxesCollection = (db: Firestore) => createCollection<TTax, TTax>(db, 'taxes');

export const statesCollection = (db: Firestore) =>
  createCollection<ActiveStates, ActiveStates>(db, 'states');

export const moratoriumsCollection = (db: Firestore) =>
  createCollection<Moratorium, Moratorium>(db, 'moratoriums');

export const agencyAppCollection = (db: Firestore) =>
  createCollection<AgencyApplication, AgencyApplication>(db, 'agencySubmissions');

export const taxTransactionsCollection = (db: Firestore) =>
  createCollection<TaxTransaction>(db, Collection.Enum.taxTransactions);

export const finTrxCollection = (db: Firestore) =>
  createCollection<Charge, Charge>(db, 'financialTransactions');

export const importSummaryCollection = (db: Firestore) =>
  createCollection<ImportSummary, ImportSummary>(db, 'dataImports');

// SUB COLLECTIONS
export const userClaimsCollection = (db: Firestore, orgId: string, ...rest: string[]) =>
  createCollection<UserClaims, UserClaims>(
    db,
    'organizations',
    orgId,
    Collection.Enum.userClaims,
    ...rest
  );

export const invitesCollection = (db: Firestore, orgId: string, ...rest: string[]) =>
  createCollection<Invite, Invite>(
    db,
    'organizations',
    orgId,
    Collection.Enum.invitations,
    ...rest
  );

export const paymentMethodsCollection = (db: Firestore, userId: string, ...rest: string[]) =>
  createCollection<PaymentMethod, PaymentMethod>(
    db,
    'users',
    userId,
    Collection.Enum.paymentMethods,
    ...rest
  );

export const changeRequestsCollection = (db: Firestore, policyId: string, ...rest: string[]) =>
  createCollection<ChangeRequest, ChangeRequest>(
    db,
    'policies',
    policyId,
    Collection.Enum.changeRequests,
    ...rest
  );

export const policyClaimsCollection = (db: Firestore, policyId: string, ...rest: string[]) =>
  createCollection<PolicyClaim & DraftPolicyClaim, PolicyClaim & DraftPolicyClaim>(
    db,
    'policies',
    policyId,
    Collection.Enum.claims,
    ...rest
  );

export const stagedImportsCollection = (db: Firestore, importId: string, ...rest: string[]) =>
  createCollection<StageImportRecord, StageImportRecord>(
    db,
    'dataImports',
    importId,
    Collection.Enum.stagedDocs,
    ...rest
  );

export const userAccess = (db: Firestore, userId: string) =>
  createCollection<UserAccess, UserAccess>(db, 'users', userId, Collection.Enum.permissions);

// export const notificationsCollection = (userId: string) =>
//   createCollection<Notification>(COLLECTIONS.USERS, userId, COLLECTIONS.NOTIFICATIONS);
// export const licensesCollection = (orgId: string) =>
// createCollection<License>(COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.LICENSES);
