import 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

initializeApp();

export { getPropertyDetails } from './Callables';
export { newSubmissionNotifications } from './firestoreEvents';
