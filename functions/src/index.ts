import 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { getPropertyDetails } from './callables';
export { newSubmissionNotifications } from './firestoreEvents';
export { beforeSignIn, beforeCreate } from './authEvents';
export { authRequests } from './routes';
