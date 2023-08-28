import { collection, CollectionReference, DocumentData, Firestore } from 'firebase/firestore';

import { COLLECTIONS } from './enums';
import {
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
  Quote,
  PaymentMethod,
  Charge,
  ChangeRequest,
  PropertyDataRes,
  PortfolioSubmission,
} from './types';

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

export const portfolioSubmissionsCollection = (db: Firestore) =>
  createCollection<PortfolioSubmission>(db, COLLECTIONS.PORTFOLIO_SUBMISSIONS);

// export const quotesCollection = (db: Firestore) =>
//   createCollection<QuoteData>(db, COLLECTIONS.QUOTES);

// TODO: change to quotes instead of submission quotes
export const quotesCollection = (db: Firestore) => createCollection<Quote>(db, COLLECTIONS.QUOTES);

export const ratingCollection = (db: Firestore) =>
  createCollection<RatingData>(db, COLLECTIONS.RATING_DATA);

export const spatialKeyCollection = (db: Firestore) =>
  createCollection<SpatialKeyResponse>(db, COLLECTIONS.SK_RES);

export const propertyDataResCollection = (db: Firestore) =>
  createCollection<PropertyDataRes>(db, COLLECTIONS.PROPERTY_DATA_RES);

export const orgsCollection = (db: Firestore) =>
  createCollection<Organization>(db, COLLECTIONS.ORGANIZATIONS);

export const policiesCollection = (db: Firestore) =>
  createCollection<Policy>(db, COLLECTIONS.POLICIES);

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

export const finTrxCollection = (db: Firestore) =>
  createCollection<Charge>(db, COLLECTIONS.FIN_TRANSACTIONS);

// SUB COLLECTIONS
export const userClaimsCollection = (db: Firestore, orgId: string, ...rest: string[]) =>
  createCollection<UserClaims>(
    db,
    COLLECTIONS.ORGANIZATIONS,
    orgId,
    COLLECTIONS.USER_CLAIMS,
    ...rest
  );

export const invitesCollection = (db: Firestore, orgId: string, ...rest: string[]) =>
  createCollection<Invite>(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.INVITES, ...rest);

export const paymentMethodsCollection = (db: Firestore, userId: string, ...rest: string[]) =>
  createCollection<PaymentMethod>(
    db,
    COLLECTIONS.USERS,
    userId,
    COLLECTIONS.PAYMENT_METHODS,
    ...rest
  );

export const changeRequestsCollection = (db: Firestore, policyId: string, ...rest: string[]) =>
  createCollection<ChangeRequest>(
    db,
    COLLECTIONS.POLICIES,
    policyId,
    COLLECTIONS.CHANGE_REQUESTS,
    ...rest
  );

export const policyClaimsCollection = (db: Firestore, policyId: string, ...rest: string[]) =>
  createCollection<any>(db, COLLECTIONS.POLICIES, policyId, COLLECTIONS.CLAIMS, ...rest);

// export const notificationsCollection = (userId: string) =>
//   createCollection<Notification>(COLLECTIONS.USERS, userId, COLLECTIONS.NOTIFICATIONS);
// export const licensesCollection = (orgId: string) =>
// createCollection<License>(COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.LICENSES);
