import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';

import { COLLECTIONS } from '../common/enums.js';

// export { getStaticSubmissionImg } from './getStaticSubmissionImg.js';
// export { newSubmissionNotifications } from './newSubmissionNotifications.js';

// export { getSubmissionAAL } from './getSubmissionAAL.js';
// export { getSubmissionFIPS } from './getSubmissionFIPS.js';
// export { mirrorCustomClaims } from './mirrorCustomClaims.js';
// export { newAgencyAppNotification } from './newAgencyAppNotification.js';
// export { sendInviteEmail } from './sendInviteEmail.js';

export type { ClaimsDocData } from './mirrorCustomClaims.js';

export const swissReClientId = defineSecret('SWISS_RE_CLIENT_ID');
export const swissReClientSecret = defineSecret('SWISS_RE_CLIENT_SECRET');
export const swissReSubscriptionKey = defineSecret('SWISS_RE_SUBSCRIPTION_KEY');

export const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

// export const firestoreOnCreateFn = functions.firestore
//   .document('users/{id}')
//   .onCreate(async (snapshot, context) => {
//     await (await import('./fn/firestoreOnCreateFn')).default(snapshot, context);
//   });

export const getStaticSubmissionImg = functions.firestore
  .document(`${COLLECTIONS.SUBMISSIONS}/{submissionId}`)
  .onCreate(async (snapshot, context) => {
    await (await import('./getStaticSubmissionImg.js')).default(snapshot, context);
  });

export const getSubmissionAAL = functions
  .runWith({ secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] })
  .firestore.document(`${COLLECTIONS.SUBMISSIONS}/{submissionId}`)
  .onCreate(async (snapshot, context) => {
    await (await import('./getSubmissionAAL.js')).default(snapshot, context);
  });

export const getSubmissionFIPS = functions.firestore
  .document(`${COLLECTIONS.SUBMISSIONS}/{submissionId}`)
  .onCreate(async (snapshot, context) => {
    await (await import('./getSubmissionFIPS.js')).default(snapshot, context);
  });

export const mirrorCustomClaims = functions.firestore
  .document(`${COLLECTIONS.ORGANIZATIONS}/{orgId}/${COLLECTIONS.USER_CLAIMS}/{userId}`)
  .onWrite(async (snapshot, context) => {
    await (await import('./mirrorCustomClaims.js')).default(snapshot, context);
  });

export const newAgencyAppNotification = functions
  .runWith({ secrets: [sendgridApiKey] })
  .firestore.document(`${COLLECTIONS.AGENCY_APPLICATIONS}/{submissionId}`)
  .onCreate(async (snapshot, context) => {
    await (await import('./newAgencyAppNotification.js')).default(snapshot, context);
  });

export const newSubmissionNotifications = functions
  .runWith({ secrets: [sendgridApiKey] })
  .firestore.document(`${COLLECTIONS.SUBMISSIONS}/{submissionId}`)
  .onCreate(async (snapshot, context) => {
    await (await import('./newSubmissionNotifications.js')).default(snapshot, context);
  });

export const sendInviteEmail = functions
  .runWith({ secrets: [sendgridApiKey] })
  .firestore.document(`${COLLECTIONS.ORGANIZATIONS}/{orgId}/${COLLECTIONS.INVITES}/{inviteId}`)
  .onCreate(async (snapshot, context) => {
    await (await import('./sendInviteEmail.js')).default(snapshot, context);
  });

export const notifyPolicyChangeRequest = functions
  .runWith({ secrets: [sendgridApiKey] })
  .firestore.document(
    `${COLLECTIONS.POLICIES}/{policyId}/${COLLECTIONS.CHANGE_REQUESTS}/{requestId}`
  )
  .onCreate(async (snapshot, context) => {
    await (await import('./notifyPolicyChangeRequest.js')).default(snapshot, context);
  });
