import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { COLLECTIONS } from '../../common';

export const versionpolicy = onDocumentWritten(
  `${COLLECTIONS.POLICIES}/{policyId}`,
  async (event) => {
    await (await import('./versionPolicy.js')).default(event);
  }
);
