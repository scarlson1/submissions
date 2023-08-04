import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';

import {
  COLLECTIONS,
  sendgridApiKey,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common';
export type { ClaimsDocData } from './mirrorCustomClaims.js';

export const getstaticsubmissionimg = onDocumentCreated(
  `${COLLECTIONS.SUBMISSIONS}/{submissionId}`,
  async (event) => {
    await (await import('./getStaticSubmissionImg.js')).default(event);
  }
);

export const getsubmissionaal = onDocumentCreated(
  {
    document: `${COLLECTIONS.SUBMISSIONS}/{submissionId}`,
    secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey],
  },
  async (event) => {
    await (await import('./getSubmissionAAL.js')).default(event);
  }
);

export const getsubmissionfips = onDocumentCreated(
  `${COLLECTIONS.SUBMISSIONS}/{submissionId}`,
  async (event) => {
    await (await import('./getSubmissionFIPS.js')).default(event);
  }
);

export const mirrorcustomclaims = onDocumentWritten(
  `${COLLECTIONS.ORGANIZATIONS}/{orgId}/${COLLECTIONS.USER_CLAIMS}/{userId}`,
  async (event) => {
    await (await import('./mirrorCustomClaims.js')).default(event);
  }
);

export const newagencyappnotification = onDocumentCreated(
  {
    document: `${COLLECTIONS.AGENCY_APPLICATIONS}/{submissionId}`,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    await (await import('./newAgencyAppNotification.js')).default(event);
  }
);

export const newsubmissionnotifications = onDocumentCreated(
  {
    document: `${COLLECTIONS.SUBMISSIONS}/{submissionId}`,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    await (await import('./newSubmissionNotifications.js')).default(event);
  }
);

export const sendinviteemail = onDocumentCreated(
  {
    document: `${COLLECTIONS.ORGANIZATIONS}/{orgId}/${COLLECTIONS.INVITES}/{inviteId}`,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    await (await import('./sendInviteEmail.js')).default(event);
  }
);

// REPLACED BY policychangerequest listener
// export const notifypolicychangerequest = onDocumentCreated(
//   {
//     document: `${COLLECTIONS.POLICIES}/{policyId}/${COLLECTIONS.CHANGE_REQUESTS}/{requestId}`,
//     secrets: [sendgridApiKey],
//   },
//   async (event) => {
//     await (await import('./notifyPolicyChangeRequest.js')).default(event);
//   }
// );

export const policychangerequest = onDocumentWritten(
  {
    document: `${COLLECTIONS.POLICIES}/{policyId}/${COLLECTIONS.CHANGE_REQUESTS}/{requestId}`,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    await (await import('./policyChangeRequest.js')).default(event);
  }
);
