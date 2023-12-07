import { initializeApp } from 'firebase-admin/app';
import 'firebase-functions';

initializeApp();

// TODO: reset routes/sendgrid to v1 so URL is consistent on all deploys (or set up hosting rewrite ??)

export {
  beforecreate,
  beforesignin,
  createFirestoreUser,
  setClaimsFromInvite,
  setUidByEmailOnCreate,
} from './authEvents/index.js';
export {
  addbillingentity,
  approvechangerequest,
  approveimport,
  assignquote,
  calcaddlocation,
  calccancelchange,
  calclocationchanges,
  calcpolicycancelchanges,
  calcpolicychanges,
  calcquote,
  createpaymentintent,
  createpolicy,
  createtenantfromsubmission,
  // deliveragencyagreement,
  executepayment,
  generatesearchkey,
  getannualpremium,
  getpropertydetailsattom,
  getriskfactorid,
  gettenantidfromemail,
  inviteusers,
  moveusertotenant,
  resendinvite,
  sendagencyapprovednotification,
  sendcontactemail,
  sendemail,
  sendnewquotenotifications,
  sendpolicydoc,
  setquoteuserid,
  submitclaim,
  verifyepaytoken,
} from './callables/index.js';
export {
  algoliasynclocations,
  algoliasyncorgs,
  algoliasyncpolicies,
  algoliasyncquotes,
  algoliasyncsubmissions,
  algoliasynctransactions,
  algoliasyncusers,
  syncusersvisibleby,
} from './firestoreEvents/algolia/index.js';
export {
  createstripeaccount,
  getstaticsubmissionimg,
  getsubmissionaal,
  getsubmissionfips,
  locationcreated,
  mirrorcustomclaims,
  newagencyappnotification,
  newsubmissionnotifications,
  policychangerequest,
  // policycreated,
  sendinviteemail,
  updatedocsonorgchange,
  updatedocsonuserchange,
  updateuseraccessonpolicychange,
  updateuseraccessonquotechange,
} from './firestoreEvents/index.js';
export {
  versionlocation,
  versionorganization,
  versionpolicy,
  versionquote,
  versionsubmission,
  versiontransaction,
} from './firestoreEvents/versions/index.js';
export {
  amendmentlistener,
  endorsementlistener,
  getstaticmapimages,
  getstaticpolicymapimages,
  locationcancellistener,
  markpaidonpaymentcomplete,
  policycreatedlistener,
  policyrenewallistener,
} from './pubsub/index.js';
export {
  authRequests,
  authrequeststest,
  copytaxes,
  generatepdf,
  sendgrid,
  stripe,
} from './routes/index.js';
export { checkachstatus } from './scheduler/index.js';
export {
  getfips,
  importpolicies,
  importquotes,
  importtransactions,
  rateportfolio,
} from './storageEvents/index.js';

export { pubsubhelper } from './routes/index.js';
// export { testEmulatorsCheckAchStatus } from './pubsub/checkAchStatus';
