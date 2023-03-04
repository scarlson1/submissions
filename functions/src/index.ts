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
  executePayment,
} from './callables';
export {
  newSubmissionNotifications,
  getStaticSubmissionImg,
  getSubmissionAAL,
  mirrorCustomClaims,
  newAgencyAppNotification,
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
export { tempGetFIPS } from './storageEvents/tempGetFIPS';
