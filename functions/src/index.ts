import 'firebase-functions';
import { initializeApp } from 'firebase-admin/app';

// https://medium.com/firebase-developers/organize-cloud-functions-for-max-cold-start-performance-and-readability-with-typescript-and-9261ee8450f0

// ex. repo for all function types: https://github.com/CodingDoug/min-functions-cold-start

initializeApp();

export {
  assignquote,
  calcquote,
  createpolicy,
  createtenantfromsubmission,
  // deliveragencyagreement,
  executepayment,
  getpropertydetails,
  generatesearchkey,
  getannualpremium,
  getpropertydetailsattom,
  getriskfactorid,
  gettenantidfromemail,
  getvaluationestimate,
  initializequote,
  inviteusers,
  moveusertotenant,
  resendinvite,
  sendagencyapprovednotification,
  sendcontactemail,
  sendnewquotenotifications,
  sendpolicydoc,
  updateandratequote,
  verifyepaytoken,
} from './callables';
export {
  newsubmissionnotifications,
  getstaticsubmissionimg,
  getsubmissionaal,
  mirrorcustomclaims,
  newagencyappnotification,
  getsubmissionfips,
  notifypolicychangerequest,
  sendinviteemail,
} from './firestoreEvents';
export {
  algoliasyncusers,
  algoliasyncorgs,
  algoliasyncsubmissions,
  algoliasyncquotes,
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
export { importpolicies, getfips, rateportfolio } from './storageEvents';
export { markpaidonpaymentcomplete, policycreatedlistener } from './pubsub';
export {
  checkachstatus,
  // checkquoteexpiration // TODO: test and finish function before deploy
} from './scheduler';

// export { pubsubHelper } from './routes/pubSubHelper.js';
// export { testEmulatorsCheckAchStatus } from './pubsub/checkAchStatus';
