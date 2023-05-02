import 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

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
export { tempGetFIPS } from './storageEvents/tempGetFIPS.js';
export {
  checkAchStatus,
  // checkQuoteExpiration, // TODO: test and finish function before deploy
} from './pubsub';
export { markpaidonpaymentcomplete } from './pubsub/markPaidOnPaymentComplete.js';
// export { pubsubHelper } from './routes/pubSubHelper.js';
// export { testEmulatorsCheckAchStatus } from './pubsub/checkAchStatus';
