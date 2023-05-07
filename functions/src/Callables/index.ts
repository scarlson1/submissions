import * as functions from 'firebase-functions';
import { defineSecret } from 'firebase-functions/params';
import { onCall as onCallv2 } from 'firebase-functions/v2/https';

const swissReClientId = defineSecret('SWISS_RE_CLIENT_ID');
const swissReClientSecret = defineSecret('SWISS_RE_CLIENT_SECRET');
const swissReSubscriptionKey = defineSecret('SWISS_RE_SUBSCRIPTION_KEY');

export const ePayCreds = defineSecret('ENCODED_EPAY_AUTH');

export const signNowCreds = defineSecret('SIGN_NOW_CREDS');
export const signNowUserCreds = defineSecret('SIGN_NOW_USER_CREDS');

export const spatialKeyUserKey = defineSecret('SPATIALKEY_USER_API_KEY');
export const spatialKeyOrgKey = defineSecret('SPATIALKEY_ORG_API_KEY');
export const spatialKeySecretKey = defineSecret('SPATIALKEY_ORG_SECRET_KEY');

export const attomKey = defineSecret('ATTOM_API_KEY');

export const veriskCredsDemo = defineSecret('VERISK_CREDS_DEMO');

export const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

export const firebaseHashConfig = defineSecret('FIREBASE_AUTH_HASH_CONFIG');

export const assignQuote = functions
  .runWith({
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    return (await import('./assignQuote.js')).default(data, ctx);
  });

export const calcQuote = functions.https.onCall(async (data, ctx) => {
  return (await import('./calcQuote.js')).default(data, ctx);
});

export const createPolicy = functions.https.onCall(async (data, ctx) => {
  return (await import('./createPolicy.js')).default(data, ctx);
});

export const createTenantFromSubmission = functions.https.onCall(async (data, ctx) => {
  return (await import('./createTenantFromSubmission.js')).default(data, ctx);
});

export const deliverAgencyAgreement = functions
  .runWith({ secrets: [signNowCreds, signNowUserCreds] })
  .https.onCall(async (data, ctx) => {
    return (await import('./deliverAgencyAgreement.js')).default(data, ctx);
  });

export const executePayment = functions
  .runWith({
    secrets: [ePayCreds],
  })
  .https.onCall(async (data, ctx) => {
    return (await import('./executePayment.js')).default(data, ctx);
  });

export const getAnnualPremium = functions
  .runWith({ secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] })
  .https.onCall(async (data, ctx) => {
    return (await import('./getAnnualPremium.js')).default(data, ctx);
  });

export const getPropertyDetails = functions
  .runWith({
    secrets: [spatialKeyUserKey, spatialKeyOrgKey, spatialKeySecretKey],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    return (await import('./getPropertyDetails.js')).default(data, ctx);
  });

export const getPropertyDetailsAttom = functions
  .runWith({
    secrets: [attomKey],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    return (await import('./getPropertyDetailsAttom.js')).default(data, ctx);
  });

export const getRiskFactorId = functions.https.onCall(async (data, ctx) => {
  return (await import('./getRiskFactorId.js')).default(data, ctx);
});

export const getriskfactoridv2 = onCallv2(async (request) => {
  return (await import('./getRiskFactorIdv2.js')).default(request);
});

export const getTenantIdFromEmail = functions.https.onCall(async (data, ctx) => {
  return (await import('./getTenantIdFromEmail.js')).default(data, ctx);
});

export const getValuationEstimate = functions
  .runWith({
    secrets: [veriskCredsDemo],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    return (await import('./getValuationEstimate.js')).default(data, ctx);
  });

export const initializeQuote = functions
  .runWith({
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    return (await import('./initializeQuote.js')).default(data, ctx);
  });

export const inviteUsers = functions.https.onCall(async (data, ctx) => {
  return (await import('./inviteUsers.js')).default(data, ctx);
});

export const moveUserToTenant = functions
  .runWith({ secrets: [firebaseHashConfig] })
  .https.onCall(async (data, ctx) => {
    return (await import('./moveUserToTenant.js')).default(data, ctx);
  });

export const resendInvite = functions
  .runWith({ secrets: [sendgridApiKey] })
  .https.onCall(async (data, ctx) => {
    return (await import('./resendInvite.js')).default(data, ctx);
  });

export const sendAgencyApprovedNotification = functions
  .runWith({ secrets: [sendgridApiKey] })
  .https.onCall(async (data, ctx) => {
    return (await import('./sendAgencyApprovedNotification.js')).default(data, ctx);
  });

export const sendContactEmail = functions
  .runWith({
    secrets: [sendgridApiKey],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    return (await import('./sendContactEmail.js')).default(data, ctx);
  });

export const sendNewQuoteNotifications = functions
  .runWith({
    secrets: [sendgridApiKey],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    return (await import('./sendNewQuoteNotifications.js')).default(data, ctx);
  });

export const sendPolicyDoc = functions
  .runWith({
    secrets: [sendgridApiKey],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    return (await import('./sendPolicyDoc.js')).default(data, ctx);
  });

export const updateAndRateQuote = functions
  .runWith({
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    return (await import('./updateAndRateQuote.js')).default(data, ctx);
  });

export const verifyEPayToken = functions
  .runWith({
    secrets: [ePayCreds],
    minInstances: 1,
    memory: '128MB',
  })
  .https.onCall(async (data, ctx) => {
    return (await import('./verifyEPayToken.js')).default(data, ctx);
  });

// export { assignQuote } from './assignQuote.js';
// export { calcQuote } from './calcQuote.js';
// export { createPolicy } from './createPolicy.js';
// export { createTenantFromSubmission } from './createTenantFromSubmission.js';
// export { deliverAgencyAgreement } from './deliverAgencyAgreement.js';
// export { executePayment } from './executePayment.js';
// export { getAnnualPremium } from './getAnnualPremium.js';
// export { getPropertyDetails } from './getPropertyDetails.js';
// export { getPropertyDetailsAttom } from './getPropertyDetailsAttom.js';
// export { getRiskFactorId } from './getRiskFactorId.js';
// export { getTenantIdFromEmail } from './getTenantIdFromEmail.js';
// export { getValuationEstimate } from './getValuationEstimate.js';
// export { initializeQuote } from './initializeQuote.js';
// export { inviteUsers } from './inviteUsers.js';
// export { moveUserToTenant } from './moveUserToTenant.js';
// export { resendInvite } from './resendInvite.js';
// export { sendAgencyApprovedNotification } from './sendAgencyApprovedNotification.js';
// export { sendContactEmail } from './sendContactEmail.js';
// export { sendNewQuoteNotifications } from './sendNewQuoteNotifications.js';
// export { sendPolicyDoc } from './sendPolicyDoc.js';
// export { updateAndRateQuote } from './updateAndRateQuote.js';
// export { verifyEPayToken } from './verifyEPayToken.js';
