import { DocumentData, CollectionReference, Firestore } from 'firebase-admin/firestore';

import { Collections } from '../common/enums';
import { Submission, User, SRRes, SRResWithAAL } from '../common/types'; // AgencyApplication, Invite, Notification, Organization,
// import { ClaimsDocData } from '../firestoreEvents/mirrorCustomClaims';

export const createCollection = <T = DocumentData>(db: Firestore, collectionName: string) => {
  return db.collection(collectionName) as CollectionReference<T>;
};

interface Policy {
  todo: true;
}

export const usersCollection = (db: Firestore) => createCollection<User>(db, Collections.USERS);
export const submissionsCollection = (db: Firestore) =>
  createCollection<Submission>(db, Collections.SUBMISSIONS);
export const policiesCollection = (db: Firestore) =>
  createCollection<Policy>(db, Collections.POLICIES);
export const swissReResCollection = (db: Firestore) =>
  createCollection<SRResWithAAL | SRRes>(db, Collections.SR_RES);

// // SUBCOLLECTIONS
// export const notificationsCollection = (db: Firestore, userId: string) =>
//   createCollection<Notification>(db, `${Collections.USERS}/${userId}/${Collections.NOTIFICATIONS}`);
// export const invitesCollection = (db: Firestore, orgId: string) =>
//   createCollection<Invite>(db, `${Collections.ORGANIZATIONS}/${orgId}/${Collections.INVITES}`);
// export const userClaimsCollection = (db: Firestore, orgId: string) =>
//   createCollection<ClaimsDocData>(
//     db,
//     `${Collections.ORGANIZATIONS}/${orgId}/${Collections.USER_CLAIMS}`
//   );
