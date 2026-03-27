import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { Collection } from '@idemand/common';
import { typesenseAdminKey } from '../../common/index.js';

// DOCS REF: https://firebase.google.com/docs/reference/functions/2nd-gen/node/firebase-functions.firestore.md#firestoreondocumentwritten

export const typesensesyncusers = onDocumentWritten(
  {
    document: `${Collection.Enum.users}/{userId}`,
    secrets: [typesenseAdminKey],
  },
  async (event) => {
    await (await import('./syncUsers.js')).default(event);
  },
);

export const typesensesynclocations = onDocumentWritten(
  {
    document: `${Collection.enum.locations}/{locationId}`,
    secrets: [typesenseAdminKey],
  },
  async (event) => {
    await (await import('./syncLocations.js')).default(event);
  },
);

export const typesensesyncorgs = onDocumentWritten(
  {
    document: `${Collection.enum.organizations}/{orgId}`,
    secrets: [typesenseAdminKey],
  },
  async (event) => {
    await (await import('./syncOrgs.js')).default(event);
  },
);

export const typesensesyncsubmissions = onDocumentWritten(
  {
    document: `${Collection.enum.submissions}/{submissionId}`,
    secrets: [typesenseAdminKey],
  },
  async (event) => {
    await (await import('./syncSubmissions.js')).default(event);
  },
);

export const typesensesyncquotes = onDocumentWritten(
  {
    document: `${Collection.enum.quotes}/{quoteId}`,
    secrets: [typesenseAdminKey],
  },
  async (event) => {
    await (await import('./syncQuotes.js')).default(event);
  },
);

export const typesensesyncpolicies = onDocumentWritten(
  {
    document: `${Collection.enum.policies}/{policyId}`,
    secrets: [typesenseAdminKey],
  },
  async (event) => {
    await (await import('./syncPolicies.js')).default(event);
  },
);

export const typesensesynctransactions = onDocumentWritten(
  {
    document: `${Collection.enum.transactions}/{trxId}`,
    secrets: [typesenseAdminKey],
  },
  async (event) => {
    await (await import('./syncFinTransactions.js')).default(event);
  },
);

export const syncusersvisibleby = onDocumentWritten(
  {
    document: `${Collection.enum.users}/{userId}/${Collection.Enum.permissions}/{docId}`,
    secrets: [typesenseAdminKey],
  },
  async (event) => {
    await (await import('./syncUsersVisibleBy.js')).default(event);
  },
);
