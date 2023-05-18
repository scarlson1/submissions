import 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

// https://medium.com/firebase-developers/organize-cloud-functions-for-max-cold-start-performance-and-readability-with-typescript-and-9261ee8450f0

// ex. repo for all function types: https://github.com/CodingDoug/min-functions-cold-start

initializeApp();

export {
  getpropertydetails,
  getpropertydetailsattom,
  sendcontactemail,
  initializequote,
  updateandratequote,
  verifyepaytoken,
  assignquote,
  sendnewquotenotifications,
  sendpolicydoc,
  executepayment,
  createpolicy,
  calcquote,
  gettenantidfromemail,
  createtenantfromsubmission,
  sendagencyapprovednotification,
  inviteusers,
  resendinvite,
  getannualpremium,
  getvaluationestimate,
  getriskfactorid,
  moveusertotenant,
  // deliveragencyagreement,
  generatesearchkey,
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
  algoliasyncusers,
  algoliasyncorgs,
  algoliasyncsubmissions,
  algoliasyncsubmissionsquotes,
  algoliasyncpolicies,
  algoliasynctransactions,
} from './firestoreEvents/algolia';
export {
  beforesignin,
  beforecreate,
  setUidByEmailOnCreate,
  createFirestoreUser,
  setClaimsFromInvite,
} from './authEvents';
export { authRequests } from './routes';
export { getaalportfolio, importpolicies, getaalandrateportfolio, getfips } from './storageEvents';
export { markpaidonpaymentcomplete } from './pubsub';
export {
  checkachstatus,
  // checkquoteexpiration // TODO: test and finish function before deploy
} from './scheduler';

// export { pubsubHelper } from './routes/pubSubHelper.js';
// export { testEmulatorsCheckAchStatus } from './pubsub/checkAchStatus';
