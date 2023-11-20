import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { Collection } from '@idemand/common';
import { algoliaAdminKey } from '../../common/index.js';

// DOCS REF: https://firebase.google.com/docs/reference/functions/2nd-gen/node/firebase-functions.firestore.md#firestoreondocumentwritten

export const algoliasyncusers = onDocumentWritten(
  {
    document: `${Collection.Enum.users}/{userId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncUsers.js')).default(event);
  }
);

export const algoliasynclocations = onDocumentWritten(
  {
    document: `${Collection.enum.locations}/{locationId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncLocations.js')).default(event);
  }
);

export const algoliasyncorgs = onDocumentWritten(
  {
    document: `${Collection.enum.organizations}/{orgId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncOrgs.js')).default(event);
  }
);

export const algoliasyncsubmissions = onDocumentWritten(
  {
    document: `${Collection.enum.submissions}/{submissionId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncSubmissions.js')).default(event);
  }
);

export const algoliasyncquotes = onDocumentWritten(
  {
    document: `${Collection.enum.quotes}/{quoteId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncQuotes.js')).default(event);
  }
);

export const algoliasyncpolicies = onDocumentWritten(
  {
    document: `${Collection.enum.policies}/{policyId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncPolicies.js')).default(event);
  }
);

export const algoliasynctransactions = onDocumentWritten(
  {
    document: `${Collection.enum.transactions}/{trxId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncFinTransactions.js')).default(event);
  }
);

export const syncusersvisibleby = onDocumentWritten(
  {
    document: `${Collection.enum.users}/{userId}/${Collection.Enum.permissions}/{docId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncUsersVisibleBy.js')).default(event);
  }
);
