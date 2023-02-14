import { DocumentData, CollectionReference, Firestore } from 'firebase-admin/firestore';

import { COLLECTIONS } from '../common';
import { Submission, User, SRRes, SRResWithAAL, Organization, Invite } from '../common'; // AgencyApplication, Invite, Notification, Organization,
import { ClaimsDocData } from '../firestoreEvents/index.js';

export const createCollection = <T = DocumentData>(db: Firestore, collectionName: string) => {
  return db.collection(collectionName) as CollectionReference<T>;
};

interface Policy {
  todo: true;
}

export const usersCollection = (db: Firestore) => createCollection<User>(db, COLLECTIONS.USERS);
export const orgsCollection = (db: Firestore) =>
  createCollection<Organization>(db, COLLECTIONS.ORGANIZATIONS);
export const submissionsCollection = (db: Firestore) =>
  createCollection<Submission>(db, COLLECTIONS.SUBMISSIONS);
export const policiesCollection = (db: Firestore) =>
  createCollection<Policy>(db, COLLECTIONS.POLICIES);
export const swissReResCollection = (db: Firestore) =>
  createCollection<SRResWithAAL | SRRes>(db, COLLECTIONS.SR_RES);

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
