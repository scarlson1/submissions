import 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { getPropertyDetails, sendContactEmail } from './callables';
export { newSubmissionNotifications, getStaticPolicyImg } from './firestoreEvents';
export { beforeSignIn, beforeCreate } from './authEvents';
export { authRequests } from './routes';
