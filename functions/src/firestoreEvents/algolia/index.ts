import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { COLLECTIONS, algoliaAdminKey } from '../../common';

// DOCS REF: https://firebase.google.com/docs/reference/functions/2nd-gen/node/firebase-functions.firestore.md#firestoreondocumentwritten

export const algoliasyncusers = onDocumentWritten(
  {
    document: `${COLLECTIONS.USERS}/{userId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncUsers.js')).default(event);
  }
);

export const algoliasynclocations = onDocumentWritten(
  {
    document: `${COLLECTIONS.LOCATIONS}/{locationId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncLocations.js')).default(event);
  }
);

export const algoliasyncorgs = onDocumentWritten(
  {
    document: `${COLLECTIONS.ORGANIZATIONS}/{orgId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncOrgs.js')).default(event);
  }
);

export const algoliasyncsubmissions = onDocumentWritten(
  {
    document: `${COLLECTIONS.SUBMISSIONS}/{submissionId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncSubmissions.js')).default(event);
  }
);

export const algoliasyncquotes = onDocumentWritten(
  {
    document: `${COLLECTIONS.QUOTES}/{quoteId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncQuotes.js')).default(event);
  }
);

export const algoliasyncpolicies = onDocumentWritten(
  {
    document: `${COLLECTIONS.POLICIES}/{policyId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncPolicies.js')).default(event);
  }
);

export const algoliasynctransactions = onDocumentWritten(
  {
    document: `${COLLECTIONS.FIN_TRANSACTIONS}/{trxId}`,
    secrets: [algoliaAdminKey],
  },
  async (event) => {
    await (await import('./syncFinTransactions.js')).default(event);
  }
);
