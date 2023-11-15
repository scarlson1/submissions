import { onDocumentCreated, onDocumentWritten } from 'firebase-functions/v2/firestore';

import { Collection } from '@idemand/common';
import {
  sendgridApiKey,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common/index.js';
export type { ClaimsDocData } from './mirrorCustomClaims.js';

export const getstaticsubmissionimg = onDocumentCreated(
  `${Collection.enum.submissions}/{submissionId}`,
  async (event) => {
    await (await import('./getStaticSubmissionImg.js')).default(event);
  }
);

export const getsubmissionaal = onDocumentCreated(
  {
    document: `${Collection.enum.submissions}/{submissionId}`,
    secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey],
  },
  async (event) => {
    await (await import('./getSubmissionAAL.js')).default(event);
  }
);

export const getsubmissionfips = onDocumentCreated(
  `${Collection.enum.submissions}/{submissionId}`,
  async (event) => {
    await (await import('./getSubmissionFIPS.js')).default(event);
  }
);

export const locationcreated = onDocumentCreated(
  {
    document: `${Collection.enum.locations}/{locationId}`,
  },
  async (event) => {
    await (await import('./locationCreated.js')).default(event);
  }
);

export const mirrorcustomclaims = onDocumentWritten(
  `${Collection.enum.organizations}/{orgId}/${Collection.enum.userClaims}/{userId}`,
  async (event) => {
    await (await import('./mirrorCustomClaims.js')).default(event);
  }
);

export const newagencyappnotification = onDocumentCreated(
  {
    document: `${Collection.enum.agencySubmissions}/{submissionId}`,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    await (await import('./newAgencyAppNotification.js')).default(event);
  }
);

export const newsubmissionnotifications = onDocumentCreated(
  {
    document: `${Collection.enum.submissions}/{submissionId}`,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    await (await import('./newSubmissionNotifications.js')).default(event);
  }
);

export const sendinviteemail = onDocumentCreated(
  {
    document: `${Collection.enum.organizations}/{orgId}/${Collection.enum.invitations}/{inviteId}`,
    secrets: [sendgridApiKey],
  },
  async (event) => {
    await (await import('./sendInviteEmail.js')).default(event);
  }
);

export const policychangerequest = onDocumentWritten(
  {
    document: `${Collection.enum.policies}/{policyId}/${Collection.enum.changeRequests}/{requestId}`,
    secrets: [sendgridApiKey, swissReClientId, swissReClientSecret, swissReSubscriptionKey],
  },
  async (event) => {
    await (await import('./policyChangeRequest.js')).default(event);
  }
);

export const updateuseraccessonpolicychange = onDocumentWritten(
  {
    document: `${Collection.Enum.policies}/{policyId}`,
  },
  async (event) => {
    await (await import('./updateUserAccessOnPolicyChange.js')).default(event);
  }
);

export const updateuseraccessonquotechange = onDocumentWritten(
  {
    document: `${Collection.Enum.quotes}/{quoteId}`,
  },
  async (event) => {
    await (await import('./updateUserAccessOnQuoteChange.js')).default(event);
  }
);
