import 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

// https://medium.com/firebase-developers/organize-cloud-functions-for-max-cold-start-performance-and-readability-with-typescript-and-9261ee8450f0

// ex. repo for all function types: https://github.com/CodingDoug/min-functions-cold-start

initializeApp();

export {
  getPropertyDetails,
  getPropertyDetailsAttom,
  sendContactEmail,
  initializeQuote,
  updateAndRateQuote,
  verifyEPayToken,
  assignQuote,
  sendNewQuoteNotifications,
  sendPolicyDoc,
  executePayment,
  createPolicy,
  calcQuote,
  getTenantIdFromEmail,
  createTenantFromSubmission,
  sendAgencyApprovedNotification,
  inviteUsers,
  resendInvite,
  getAnnualPremium,
  getValuationEstimate,
  getRiskFactorId,
  moveUserToTenant,
  // deliverAgencyAgreement,
} from './callables';
export {
  newSubmissionNotifications,
  getStaticSubmissionImg,
  getSubmissionAAL,
  mirrorCustomClaims,
  newAgencyAppNotification,
  getSubmissionFIPS,
  sendInviteEmail,
} from './firestoreEvents';
export {
  beforeSignIn,
  beforeCreate,
  setUidByEmailOnCreate,
  createFirestoreUser,
  setClaimsFromInvite,
} from './authEvents';
export { authRequests } from './routes';
export { getAALPortfolio, importPolicies, getAALAndRatePortfolio } from './storageEvents';
export {
  checkAchStatus,
  markpaidonpaymentcomplete,
  // checkQuoteExpiration, // TODO: test and finish function before deploy
} from './pubsub';

// export { pubsubHelper } from './routes/pubSubHelper.js';
// export { testEmulatorsCheckAchStatus } from './pubsub/checkAchStatus';
