import { collection, CollectionReference, DocumentData } from 'firebase/firestore';

import { Collections } from 'common/enums';
import {
  QuoteData,
  RatingData,
  SpatialKeyResponse,
  Organization,
  // Policy,
  // Notification,
  User,
  UserClaims,
  // Invite,
  // AgencyApplication,
  License,
} from 'common/types';
import { db } from 'firebaseConfig';

export const createCollection = <T = DocumentData>(collectionName: string, ...rest: string[]) => {
  return collection(db, collectionName, ...rest) as CollectionReference<T>;
};

export const quotesCollection = createCollection<QuoteData>(Collections.QUOTES);
export const ratingCollection = createCollection<RatingData>(Collections.RATING_DATA);
export const spatialKeyCollection = createCollection<SpatialKeyResponse>(Collections.SK_RES);
export const orgsCollection = createCollection<Organization>(Collections.ORGANIZATIONS);
// export const policiesCollection = createCollection<Policy>(Collections.POLICIES);
export const usersCollection = createCollection<User>(Collections.USERS);
// export const agencyAppCollection = createCollection<AgencyApplication>(
//   Collections.AGENCY_APPLICATIONS
// );
export const licensesCollection = createCollection<License>(Collections.LICENSES);

// Subcollections
export const userClaimsCollection = (orgId: string) =>
  createCollection<UserClaims>(Collections.ORGANIZATIONS, orgId, Collections.USER_CLAIMS);
// export const invitesCollection = (orgId: string, ...rest: any) =>
//   createCollection<Invite>(Collections.ORGANIZATIONS, orgId, Collections.INVITES, ...rest);
// export const notificationsCollection = (userId: string) =>
//   createCollection<Notification>(Collections.USERS, userId, Collections.NOTIFICATIONS);
// export const licensesCollection = (orgId: string) =>
// createCollection<License>(Collections.ORGANIZATIONS, orgId, Collections.LICENSES);

// EXAMPLE

// export const setJamiesUser = async () => {
//   const userRef = doc(usersCol, 'user_12345')
//   await setDoc(userRef, {
//     age: 30,
//     firstName: 'Jamie',
//     lastName: 'Curnow'
//   })
// }
