import { Collection } from '@idemand/common';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';

export const versionlocation = onDocumentWritten(
  `${Collection.enum.locations}/{locationId}`,
  async (event) => {
    await (await import('./versionLocation.js')).default(event);
  }
);

export const versionorganization = onDocumentWritten(
  `${Collection.enum.organizations}/{orgId}`,
  async (event) => {
    await (await import('./versionOrg.js')).default(event);
  }
);

export const versionpolicy = onDocumentWritten(
  `${Collection.enum.policies}/{policyId}`,
  async (event) => {
    await (await import('./versionPolicy.js')).default(event);
  }
);

export const versionquote = onDocumentWritten(
  `${Collection.enum.quotes}/{quoteId}`,
  async (event) => {
    await (await import('./versionQuote.js')).default(event);
  }
);

export const versionsubmission = onDocumentWritten(
  `${Collection.enum.submissions}/{submissionId}`,
  async (event) => {
    await (await import('./versionSubmission.js')).default(event);
  }
);

export const versiontransaction = onDocumentWritten(
  `${Collection.enum.transactions}/{trxId}`,
  async (event) => {
    await (await import('./versionTransaction.js')).default(event);
  }
);
