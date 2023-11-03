import { collection, CollectionReference, DocumentData, Firestore } from 'firebase/firestore';

import { COLLECTIONS } from './enums';
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
  PaymentMethod,
  Policy,
  PolicyClaim,
  PortfolioSubmission,
  PropertyDataRes,
  Quote,
  RatingData,
  SpatialKeyResponse,
  StageImportRecord,
  Submission,
  TTax,
  User,
  UserClaims,
} from './types';

// REACT FIRE
export const createCollection = <T = DocumentData, U extends DocumentData = DocumentData>(
  db: Firestore,
  collectionName: string,
  ...rest: string[]
) => {
  return collection(db, collectionName, ...rest) as CollectionReference<T, U>;
};

export const submissionsCollection = (db: Firestore) =>
  createCollection<Submission, Submission>(db, COLLECTIONS.SUBMISSIONS);

export const portfolioSubmissionsCollection = (db: Firestore) =>
  createCollection<PortfolioSubmission, PortfolioSubmission>(db, COLLECTIONS.PORTFOLIO_SUBMISSIONS);

export const locationsCollection = (db: Firestore) =>
  createCollection<ILocation, ILocation>(db, COLLECTIONS.LOCATIONS);

// TODO: change to quotes instead of submission quotes
export const quotesCollection = (db: Firestore) => createCollection<Quote>(db, COLLECTIONS.QUOTES);

export const ratingCollection = (db: Firestore) =>
  createCollection<RatingData, RatingData>(db, COLLECTIONS.RATING_DATA);

export const spatialKeyCollection = (db: Firestore) =>
  createCollection<SpatialKeyResponse, SpatialKeyResponse>(db, COLLECTIONS.SK_RES);

export const propertyDataResCollection = (db: Firestore) =>
  createCollection<PropertyDataRes, PropertyDataRes>(db, COLLECTIONS.PROPERTY_DATA_RES);

export const orgsCollection = (db: Firestore) =>
  createCollection<Organization, Organization>(db, COLLECTIONS.ORGANIZATIONS);

export const policiesCollection = (db: Firestore) =>
  createCollection<Policy, Policy>(db, COLLECTIONS.POLICIES);

export const usersCollection = (db: Firestore) => createCollection<User>(db, COLLECTIONS.USERS);

export const licensesCollection = (db: Firestore) =>
  createCollection<License, License>(db, COLLECTIONS.LICENSES);

export const notifyRegistration = (db: Firestore) =>
  createCollection<NotifyRegistration, NotifyRegistration>(db, COLLECTIONS.NOTIFY_REGISTRATION);

export const taxesCollection = (db: Firestore) =>
  createCollection<TTax, TTax>(db, COLLECTIONS.TAXES);

export const statesCollection = (db: Firestore) =>
  createCollection<ActiveStates, ActiveStates>(db, COLLECTIONS.ACTIVE_STATES);

export const moratoriumsCollection = (db: Firestore) =>
  createCollection<Moratorium, Moratorium>(db, COLLECTIONS.MORATORIUMS);

export const agencyAppCollection = (db: Firestore) =>
  createCollection<AgencyApplication, AgencyApplication>(db, COLLECTIONS.AGENCY_APPLICATIONS);

export const finTrxCollection = (db: Firestore) =>
  createCollection<Charge, Charge>(db, COLLECTIONS.FIN_TRANSACTIONS);

export const importSummaryCollection = (db: Firestore) =>
  createCollection<ImportSummary, ImportSummary>(db, COLLECTIONS.DATA_IMPORTS);

// SUB COLLECTIONS
export const userClaimsCollection = (db: Firestore, orgId: string, ...rest: string[]) =>
  createCollection<UserClaims, UserClaims>(
    db,
    COLLECTIONS.ORGANIZATIONS,
    orgId,
    COLLECTIONS.USER_CLAIMS,
    ...rest
  );

export const invitesCollection = (db: Firestore, orgId: string, ...rest: string[]) =>
  createCollection<Invite, Invite>(
    db,
    COLLECTIONS.ORGANIZATIONS,
    orgId,
    COLLECTIONS.INVITES,
    ...rest
  );

export const paymentMethodsCollection = (db: Firestore, userId: string, ...rest: string[]) =>
  createCollection<PaymentMethod, PaymentMethod>(
    db,
    COLLECTIONS.USERS,
    userId,
    COLLECTIONS.PAYMENT_METHODS,
    ...rest
  );

export const changeRequestsCollection = (db: Firestore, policyId: string, ...rest: string[]) =>
  createCollection<ChangeRequest, ChangeRequest>(
    db,
    COLLECTIONS.POLICIES,
    policyId,
    COLLECTIONS.CHANGE_REQUESTS,
    ...rest
  );

export const policyClaimsCollection = (db: Firestore, policyId: string, ...rest: string[]) =>
  createCollection<PolicyClaim & DraftPolicyClaim, PolicyClaim & DraftPolicyClaim>(
    db,
    COLLECTIONS.POLICIES,
    policyId,
    COLLECTIONS.CLAIMS,
    ...rest
  );

export const stagedImportsCollection = (db: Firestore, importId: string, ...rest: string[]) =>
  createCollection<StageImportRecord, StageImportRecord>(
    db,
    COLLECTIONS.DATA_IMPORTS,
    importId,
    COLLECTIONS.STAGED_RECORDS,
    ...rest
  );

// export const notificationsCollection = (userId: string) =>
//   createCollection<Notification>(COLLECTIONS.USERS, userId, COLLECTIONS.NOTIFICATIONS);
// export const licensesCollection = (orgId: string) =>
// createCollection<License>(COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.LICENSES);
