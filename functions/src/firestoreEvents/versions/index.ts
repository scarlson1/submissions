import { onDocumentWritten } from 'firebase-functions/v2/firestore';

import { COLLECTIONS } from '../../common';

export const versionlocation = onDocumentWritten(
  `${COLLECTIONS.LOCATIONS}/{locationId}`,
  async (event) => {
    await (await import('./versionLocation.js')).default(event);
  }
);

export const versionpolicy = onDocumentWritten(
  `${COLLECTIONS.POLICIES}/{policyId}`,
  async (event) => {
    await (await import('./versionPolicy.js')).default(event);
  }
);

export const versionquote = onDocumentWritten(`${COLLECTIONS.QUOTES}/{quoteId}`, async (event) => {
  await (await import('./versionQuote.js')).default(event);
});

export const versionsubmission = onDocumentWritten(
  `${COLLECTIONS.SUBMISSIONS}/{submissionId}`,
  async (event) => {
    await (await import('./versionSubmission.js')).default(event);
  }
);
