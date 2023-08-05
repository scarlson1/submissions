import { initializeApp } from 'firebase-admin/app';
import 'firebase-functions';

// https://medium.com/firebase-developers/organize-cloud-functions-for-max-cold-start-performance-and-readability-with-typescript-and-9261ee8450f0

// ex. repo for all function types: https://github.com/CodingDoug/min-functions-cold-start

initializeApp();

// CALLABLES

// firebase deploy --only functions:assignquote,functions:calcquote,functions:createpolicy,functions:createtenantfromsubmission

// firebase deploy --only functions:executepayment,functions:getpropertydetails,functions:generatesearchkey,functions:getannualpremium,functions:getpropertydetailsattom,functions:getriskfactorid

// firebase deploy --only functions:gettenantidfromemail,functions:getvaluationestimate,functions:initializequote,functions:inviteusers,functions:moveusertotenant,functions:resendinvite,functions:sendagencyapprovednotification,functions:sendcontactemail,functions:sendnewquotenotifications,functions:sendpolicydoc,functions:updateandratequote,functions:verifyepaytoken

// FIRESTORE EVENTS
// firebase deploy --only functions:newsubmissionnotifications,functions:getstaticsubmissionimg,functions:getsubmissionaal,functions:mirrorcustomclaims,functions:newagencyappnotification,functions:getsubmissionfips,functions:notifypolicychangerequest,functions:sendinviteemail

// ALGOLIA
// firebase deploy --only functions:algoliasyncusers,functions:algoliasyncorgs,functions:algoliasyncsubmissions,functions:algoliasyncquotes,functions:algoliasyncpolicies,functions:algoliasynctransactions

// AUTH
// firebase deploy --only functions:beforesignin,functions:beforecreate,functions:setUidByEmailOnCreate,functions:createFirestoreUser,functions:setClaimsFromInvite

// REST
// firebase deploy --only functions:authRequests,functions:sendgrid,functions:importpolicies,functions:getfips,functions:rateportfolio,functions:policycreatedlistener,functions:checkachstatus

// functions:markpaidonpaymentcomplete,

export {
  beforecreate,
  beforesignin,
  createFirestoreUser,
  setClaimsFromInvite,
  setUidByEmailOnCreate,
} from './authEvents';
export {
  approvechangerequest,
  assignquote,
  calcquote,
  createpolicy,
  createtenantfromsubmission,
  // deliveragencyagreement,
  executepayment,
  generatesearchkey,
  getannualpremium,
  getpropertydetails,
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
  getstaticsubmissionimg,
  getsubmissionaal,
  getsubmissionfips,
  mirrorcustomclaims,
  newagencyappnotification,
  newsubmissionnotifications,
  // notifypolicychangerequest,
  policychangerequest,
  sendinviteemail,
} from './firestoreEvents';
export {
  algoliasyncorgs,
  algoliasyncpolicies,
  algoliasyncquotes,
  algoliasyncsubmissions,
  algoliasynctransactions,
  algoliasyncusers,
} from './firestoreEvents/algolia';
export {
  amendmentlistener,
  endorsementlistener,
  locationcancellistener,
  markpaidonpaymentcomplete,
  policycreatedlistener,
  policyrenewallistener,
} from './pubsub';
export { authRequests, authrequeststest, generatepdf, sendgrid } from './routes';
export { checkachstatus } from './scheduler';
export { getfips, importpolicies, importquotes, rateportfolio } from './storageEvents';

// export { pubsubHelper } from './routes/pubSubHelper.js';
// export { testEmulatorsCheckAchStatus } from './pubsub/checkAchStatus';
