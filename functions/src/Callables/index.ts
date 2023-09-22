import { CallableRequest, onCall } from 'firebase-functions/v2/https';

import {
  algoliaAdminKey,
  algoliaIDemandAdminSearchKey,
  algoliaUserBaseKey,
  attomKey,
  ePayCreds,
  firebaseHashConfig,
  minInstances,
  sendgridApiKey,
  signNowCreds,
  signNowUserCreds,
  swissReClientId,
  swissReClientSecret,
  swissReSubscriptionKey,
} from '../common/index.js';
import { GetPropertyDetailsAttomRequest } from './getPropertyDetailsAttom.js';

export const addlocationcalc = onCall(
  { secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] },
  async (request) => {
    return (await import('./addLocationCalc.js')).default(request);
  }
);

export const approvechangerequest = onCall(async (request) => {
  return (await import('./approveChangeRequest.js')).default(request);
});

export const approveimport = onCall(async (request) => {
  return (await import('./approveImport.js')).default(request);
});

export const assignquote = onCall(
  { minInstances: minInstances, memory: '128MiB' },
  async (request) => {
    return (await import('./assignQuote.js')).default(request);
  }
);

export const calcquote = onCall(async (request) => {
  return (await import('./calcQuote.js')).default(request);
});

export const createpolicy = onCall(async (request) => {
  return (await import('./createPolicy.js')).default(request);
});

export const createtenantfromsubmission = onCall(async (request) => {
  return (await import('./createTenantFromSubmission.js')).default(request);
});

export const deliveragencyagreement = onCall(
  { secrets: [signNowCreds, signNowUserCreds] },
  async (request) => {
    return (await import('./deliverAgencyAgreement.js')).default(request);
  }
);

export const executepayment = onCall({ secrets: [ePayCreds] }, async (request) => {
  return (await import('./executePayment.js')).default(request);
});

export const generatesearchkey = onCall(
  {
    secrets: [algoliaAdminKey, algoliaUserBaseKey, algoliaIDemandAdminSearchKey],
  },
  async (request) => {
    return (await import('./generateSearchKey.js')).default(request);
  }
);

export const getannualpremium = onCall(
  { secrets: [swissReClientId, swissReClientSecret, swissReSubscriptionKey] },
  async (request) => {
    return (await import('./getAnnualPremium.js')).default(request);
  }
);

export const getpropertydetailsattom = onCall(
  {
    secrets: [attomKey],
    memory: '128MiB',
  },
  async (request: CallableRequest<GetPropertyDetailsAttomRequest>) => {
    return (await import('./getPropertyDetailsAttom.js')).default(request);
  }
);

export const getriskfactorid = onCall(async (request) => {
  return (await import('./getRiskFactorId.js')).default(request);
});

export const gettenantidfromemail = onCall(async (request) => {
  return (await import('./getTenantIdFromEmail.js')).default(request);
});

export const inviteusers = onCall(async (request) => {
  return (await import('./inviteUsers.js')).default(request);
});

export const moveusertotenant = onCall({ secrets: [firebaseHashConfig] }, async (request) => {
  return (await import('./moveUserToTenant.js')).default(request);
});

export const resendinvite = onCall({ secrets: [sendgridApiKey] }, async (request) => {
  return (await import('./resendInvite.js')).default(request);
});

export const sendagencyapprovednotification = onCall(
  { secrets: [sendgridApiKey] },
  async (request) => {
    return (await import('./sendAgencyApprovedNotification.js')).default(request);
  }
);

export const sendcontactemail = onCall(
  {
    secrets: [sendgridApiKey],
  },
  async (request) => {
    return (await import('./sendContactEmail.js')).default(request);
  }
);

export const sendemail = onCall(
  {
    secrets: [sendgridApiKey],
  },
  async (request) => {
    return (await import('./sendEmail.js')).default(request);
  }
);

export const sendnewquotenotifications = onCall(
  {
    secrets: [sendgridApiKey],
    // minInstances: 1,
    // memory: '128MiB',
  },
  async (request) => {
    return (await import('./sendNewQuoteNotifications.js')).default(request);
  }
);

export const sendpolicydoc = onCall(
  {
    secrets: [sendgridApiKey],
    // minInstances: 1,
    // memory: '128MiB',
  },
  async (request) => {
    return (await import('./sendPolicyDoc.js')).default(request);
  }
);

export const verifyepaytoken = onCall(
  {
    secrets: [ePayCreds],
    minInstances,
    memory: '128MiB',
  },
  async (request) => {
    return (await import('./verifyEPayToken.js')).default(request);
  }
);
