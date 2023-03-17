import 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export {
  getPropertyDetails,
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
} from './callables';
export {
  newSubmissionNotifications,
  getStaticSubmissionImg,
  getSubmissionAAL,
  mirrorCustomClaims,
  newAgencyAppNotification,
  getSubmissionFIPS,
} from './firestoreEvents';
export {
  beforeSignIn,
  beforeCreate,
  setUidByEmailOnCreate,
  createFirestoreUser,
  setClaimsFromInvite,
} from './authEvents';
export { authRequests } from './routes';
export { getAALPortfolio } from './storageEvents';
export { tempGetFIPS } from './storageEvents/tempGetFIPS.js';
export { checkAchStatus } from './pubsub';
export { markpaidonpaymentcomplete } from './pubsub/markPaidOnPaymentComplete.js';
// export { pubsubHelper } from './routes/pubSubHelper.js';
// export { testEmulatorsCheckAchStatus } from './pubsub/checkAchStatus';
