import { Collection } from '@idemand/common';
import {
  onDocumentCreated,
  onDocumentWritten,
} from 'firebase-functions/v2/firestore';
import {
  resendKey,
  stripeSecretKey,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common/index.js';
export type { ClaimsDocData } from './mirrorCustomClaims.js';

export const createreceivableonpolicycreated = onDocumentCreated(
  {
    document: `${Collection.Enum.policies}/{policyId}`,
    secrets: [stripeSecretKey],
  },
  async (event) => {
    await (await import('./createReceivableOnPolicyCreated.js')).default(event);
  },
);

export const createstripeaccount = onDocumentCreated(
  {
    document: `${Collection.enum.organizations}/{orgId}`,
    secrets: [stripeSecretKey],
  },
  async (event) => {
    await (await import('./createStripeAccount.js')).default(event);
  },
);

export const getstaticsubmissionimg = onDocumentCreated(
  `${Collection.enum.submissions}/{submissionId}`,
  async (event) => {
    await (await import('./getStaticSubmissionImg.js')).default(event);
  },
);

export const getsubmissionaal = onDocumentCreated(
  {
    document: `${Collection.enum.submissions}/{submissionId}`,
    secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey],
  },
  async (event) => {
    await (await import('./getSubmissionAAL.js')).default(event);
  },
);

export const getsubmissionfips = onDocumentCreated(
  `${Collection.enum.submissions}/{submissionId}`,
  async (event) => {
    await (await import('./getSubmissionFIPS.js')).default(event);
  },
);

export const locationcreated = onDocumentCreated(
  {
    document: `${Collection.enum.locations}/{locationId}`,
  },
  async (event) => {
    await (await import('./locationCreated.js')).default(event);
  },
);

export const mirrorcustomclaims = onDocumentWritten(
  `${Collection.enum.organizations}/{orgId}/${Collection.enum.userClaims}/{userId}`,
  async (event) => {
    await (await import('./mirrorCustomClaims.js')).default(event);
  },
);

export const newagencyappnotification = onDocumentCreated(
  {
    document: `${Collection.enum.agencySubmissions}/{submissionId}`,
    secrets: [resendKey],
  },
  async (event) => {
    await (await import('./newAgencyAppNotification.js')).default(event);
  },
);

export const newsubmissionnotifications = onDocumentCreated(
  {
    document: `${Collection.enum.submissions}/{submissionId}`,
    secrets: [resendKey],
  },
  async (event) => {
    await (await import('./newSubmissionNotifications.js')).default(event);
  },
);

export const sendinviteemail = onDocumentCreated(
  {
    document: `${Collection.enum.organizations}/{orgId}/${Collection.enum.invitations}/{inviteId}`,
    secrets: [resendKey],
  },
  async (event) => {
    await (await import('./sendInviteEmail.js')).default(event);
  },
);

export const policychangerequest = onDocumentWritten(
  {
    document: `${Collection.enum.policies}/{policyId}/${Collection.enum.changeRequests}/{requestId}`,
    secrets: [
      resendKey,
      swissReClientId,
      swissReClientSecret,
      swissReSubscriptionKey,
    ],
  },
  async (event) => {
    await (await import('./policyChangeRequest.js')).default(event);
  },
);

export const updatedocsonorgchange = onDocumentWritten(
  {
    document: `${Collection.Enum.organizations}/{orgId}`,
  },
  async (event) => {
    await (await import('./updateDocsOnOrgChange.js')).default(event);
  },
);

export const updatedocsonuserchange = onDocumentWritten(
  {
    document: `${Collection.Enum.users}/{userId}`,
  },
  async (event) => {
    await (await import('./updateDocsOnUserChange.js')).default(event);
  },
);

export const updateuseraccessonpolicychange = onDocumentWritten(
  {
    document: `${Collection.Enum.policies}/{policyId}`,
  },
  async (event) => {
    await (await import('./updateUserAccessOnPolicyChange.js')).default(event);
  },
);

export const updateuseraccessonquotechange = onDocumentWritten(
  {
    document: `${Collection.Enum.quotes}/{quoteId}`,
  },
  async (event) => {
    await (await import('./updateUserAccessOnQuoteChange.js')).default(event);
  },
);
