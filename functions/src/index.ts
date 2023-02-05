import 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export {
  getPropertyDetails,
  sendContactEmail,
  initializeQuote,
  updateAndRateQuote,
} from './callables';
export { newSubmissionNotifications, getStaticSubmissionImg } from './firestoreEvents';
export {
  beforeSignIn,
  beforeCreate,
  setUidByEmailOnCreate,
  createFirestoreUser,
} from './authEvents';
export { authRequests } from './routes';
