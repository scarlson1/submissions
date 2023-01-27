import 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { getPropertyDetails, sendContactEmail } from './callables';
export { newSubmissionNotifications, getStaticSubmissionImg } from './firestoreEvents';
export {
  beforeSignIn,
  beforeCreate,
  setUidByEmailOnCreate,
  createFirestoreUser,
} from './authEvents';
export { authRequests } from './routes';
