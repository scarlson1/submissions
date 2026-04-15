import {
  Collection,
  invitesCollection,
  licensesCollection,
  locationsCollection,
  moratoriumsCollection,
  orgsCollection,
  policiesCollection,
  quotesCollection,
  submissionsCollection,
  swissReResCollection,
  taxesCollection,
  usersCollection,
  type PolicyClaim,
} from '@idemand/common';
import {
  CollectionReference,
  DocumentData,
  Firestore,
} from 'firebase-admin/firestore';
import Stripe from 'stripe';
import {
  AgencyApplication,
  ChangeRequest,
  Charge,
  Disclosure,
  ImportSummary,
  PaymentMethod,
  PropertyDataRes,
  RatingData,
  StageImportRecord,
  Transaction,
} from '../common/index.js';
import { ClaimsDocData } from '../firestoreEvents/index.js';

export {
  invitesCollection,
  licensesCollection,
  locationsCollection,
  moratoriumsCollection,
  orgsCollection,
  policiesCollection,
  quotesCollection,
  submissionsCollection,
  swissReResCollection,
  taxesCollection,
  usersCollection,
};

// TODO: convert to "...string[]" instead of template literal

export const createCollection = <T = DocumentData>(
  db: Firestore,
  collectionPath: Collection | string,
) => {
  return db.collection(collectionPath) as CollectionReference<T>;
};

export const transfersCollection = (db: Firestore) =>
  createCollection<Stripe.Transfer | Stripe.TransferReversal>(db, 'transfers');

// export const receivablesCollection = (db: Firestore) =>
//   createCollection<Receivable>(db, 'receivables');

export const ratingDataCollection = (db: Firestore) =>
  createCollection<RatingData>(db, 'ratingData');

export const propertyDataResCollection = (db: Firestore) =>
  createCollection<PropertyDataRes>(db, 'propertyDataRes');

export const finTrxCollection = (db: Firestore) =>
  createCollection<Charge>(db, 'financialTransactions');

export const policyClaimsCollection = (db: Firestore, policyId: string) =>
  createCollection<PolicyClaim>(
    db,
    `${Collection.enum.policies}/${policyId}/${Collection.enum.claims}`,
  );

export const transactionsCollection = (db: Firestore) =>
  createCollection<Transaction>(db, 'transactions');

export const agencyApplicationCollection = (db: Firestore) =>
  createCollection<AgencyApplication>(db, 'agencySubmissions');

export const emailActivityCollection = (db: Firestore) =>
  createCollection<any>(db, 'emailActivity');

export const disclosuresCollection = (db: Firestore) =>
  createCollection<Disclosure>(db, 'disclosures');

export const importSummaryCollection = (db: Firestore) =>
  createCollection<ImportSummary>(db, 'dataImports');

// // SUB-COLLECTIONS
// export const notificationsCollection = (db: Firestore, userId: string) =>
//   createCollection<Notification>(db, `${COLLECTIONS.USERS}/${userId}/${COLLECTIONS.NOTIFICATIONS}`);

export const userClaimsCollection = (db: Firestore, orgId: string) =>
  createCollection<ClaimsDocData>(
    db,
    `${Collection.enum.organizations}/${orgId}/${Collection.enum.userClaims}`,
  );

export const paymentMethodsCollection = (db: Firestore, userId: string) =>
  createCollection<PaymentMethod>(
    db,
    `${Collection.enum.users}/${userId}/${Collection.enum.paymentMethods}`,
  );

export const changeRequestsCollection = <
  T extends ChangeRequest = ChangeRequest,
>(
  db: Firestore,
  policyId: string,
) =>
  createCollection<T>(
    db,
    `${Collection.enum.policies}/${policyId}/${Collection.enum.changeRequests}`,
  );

export const stagedImportsCollection = (db: Firestore, importId: string) =>
  createCollection<StageImportRecord>(
    db,
    `${Collection.enum.dataImports}/${importId}/${Collection.enum.stagedDocs}`,
  );

export const versionsCollection = <T extends DocumentData>(
  db: Firestore,
  parentCollection: Collection,
  parentId: string,
) =>
  createCollection<T>(
    db,
    `${parentCollection}/${parentId}/${Collection.enum.versions}`,
  );
