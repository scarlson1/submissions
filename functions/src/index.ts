import { initializeApp } from 'firebase-admin/app';
import 'firebase-functions';

initializeApp();

// TODO: reset routes/sendgrid to v1 so URL is consistent on all deploys (or set up hosting rewrite ??)

import {
  beforecreate,
  beforesignin,
  createFirestoreUser,
  setClaimsFromInvite,
  setUidByEmailOnCreate,
} from './authEvents/index.js';

// prefixes 'auth-' to each function name
export const auth = {
  beforesignin,
  beforecreate,
  createFirestoreUser,
  setClaimsFromInvite,
  setUidByEmailOnCreate,
};

import {
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
  calctotalsbybillingentity,
  createpaymentintent,
  createpolicy,
  createtenantfromsubmission,
  // deliveragencyagreement,
  executepayment,
  fetchpaymentintentsecret,
  generatesearchkey,
  getannualpremium,
  getpropertydetailsattom,
  getriskfactorid,
  gettenantidfromemail,
  initializefipsfirestoredata,
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

export const call = {
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
  calctotalsbybillingentity,
  createpaymentintent,
  createpolicy,
  createtenantfromsubmission,
  // deliveragencyagreement,
  executepayment,
  fetchpaymentintentsecret,
  generatesearchkey,
  getannualpremium,
  getpropertydetailsattom,
  getriskfactorid,
  gettenantidfromemail,
  initializefipsfirestoredata,
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
};

import {
  createreceivableonpolicycreated,
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

export const firestore = {
  createreceivableonpolicycreated,
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
};

import {
  syncusersvisibleby,
  typesensesynclocations,
  typesensesyncorgs,
  typesensesyncpolicies,
  typesensesyncquotes,
  typesensesyncsubmissions,
  typesensesynctransactions,
  typesensesyncusers,
} from './firestoreEvents/search/index.js';

export const search = {
  syncusersvisibleby,
  synclocations: typesensesynclocations,
  syncorgs: typesensesyncorgs,
  syncpolicies: typesensesyncpolicies,
  syncquotes: typesensesyncquotes,
  syncsubmissions: typesensesyncsubmissions,
  synctransactions: typesensesynctransactions,
  syncusers: typesensesyncusers,
};

import {
  versionlocation,
  versionorganization,
  versionpolicy,
  versionquote,
  versionsubmission,
  versiontransaction,
} from './firestoreEvents/versions/index.js';

export const version = {
  location: versionlocation,
  organization: versionorganization,
  policy: versionpolicy,
  quote: versionquote,
  submission: versionsubmission,
  transaction: versiontransaction,
};

import {
  amendmentlistener,
  endorsementlistener,
  getstaticmapimages,
  getstaticpolicymapimages,
  locationcancellistener,
  markpaidonpaymentcomplete,
  policycreatedlistener,
  policyrenewallistener,
} from './pubsub/index.js';

export const pubsub = {
  amendmentlistener,
  endorsementlistener,
  getstaticmapimages,
  getstaticpolicymapimages,
  locationcancellistener,
  markpaidonpaymentcomplete,
  policycreatedlistener,
  policyrenewallistener,
};

import {
  createtaxtransactions,
  createtransfers,
  markpolicypaid,
  reversetaxtransactions,
  reversetransfers,
} from './pubsub/stripe/index.js';

export const stripepubsub = {
  createtaxtransactions,
  createtransfers,
  markpolicypaid,
  reversetaxtransactions,
  reversetransfers,
};

import {
  authRequests,
  authrequeststest,
  copytaxes,
  generatepdf,
  // quickbooks,
  resend,
  stripe,
} from './routes/index.js';

// export const request = {
//   authRequests,
//   authrequeststest,
//   copytaxes,
//   generatepdf,
//   // quickbooks,
// };
export {
  authRequests,
  authrequeststest,
  copytaxes,
  generatepdf,
  resend,
  stripe,
};

import {
  // checkachstatus // legacy epay - replaced by stripe webhook
  checkquoteexpiration,
} from './scheduler/index.js';

export const cron = {
  checkquoteexpiration,
};

import {
  getfips,
  importpolicies,
  importquotes,
  importtransactions,
  rateportfolio,
} from './storageEvents/index.js';

export const storage = {
  getfips,
  importpolicies,
  importquotes,
  importtransactions,
  rateportfolio,
};

// import { pubsubhelper } from './routes/index.js';
// export { testEmulatorsCheckAchStatus } from './pubsub/checkAchStatus';

// ====== ungrouped exports =======

// export {
//   beforecreate,
//   beforesignin,
//   createFirestoreUser,
//   setClaimsFromInvite,
//   setUidByEmailOnCreate,
// } from './authEvents/index.js';

// export {
//   addbillingentity,
//   approvechangerequest,
//   approveimport,
//   assignquote,
//   calcaddlocation,
//   calccancelchange,
//   calclocationchanges,
//   calcpolicycancelchanges,
//   calcpolicychanges,
//   calcquote,
//   calctotalsbybillingentity,
//   createpaymentintent,
//   createpolicy,
//   createtenantfromsubmission,
//   // deliveragencyagreement,
//   executepayment,
//   fetchpaymentintentsecret,
//   generatesearchkey,
//   getannualpremium,
//   getpropertydetailsattom,
//   getriskfactorid,
//   gettenantidfromemail,
//   initializefipsfirestoredata,
//   inviteusers,
//   moveusertotenant,
//   resendinvite,
//   sendagencyapprovednotification,
//   sendcontactemail,
//   sendemail,
//   sendnewquotenotifications,
//   sendpolicydoc,
//   setquoteuserid,
//   submitclaim,
//   verifyepaytoken,
// } from './callables/index.js';

// export {
//   syncusersvisibleby,
//   typesensesynclocations,
//   typesensesyncorgs,
//   typesensesyncpolicies,
//   typesensesyncquotes,
//   typesensesyncsubmissions,
//   typesensesynctransactions,
//   typesensesyncusers,
// } from './firestoreEvents/search/index.js';

// export {
//   createreceivableonpolicycreated,
//   createstripeaccount,
//   getstaticsubmissionimg,
//   getsubmissionaal,
//   getsubmissionfips,
//   locationcreated,
//   mirrorcustomclaims,
//   newagencyappnotification,
//   newsubmissionnotifications,
//   policychangerequest,
//   // policycreated,
//   sendinviteemail,
//   updatedocsonorgchange,
//   updatedocsonuserchange,
//   updateuseraccessonpolicychange,
//   updateuseraccessonquotechange,
// } from './firestoreEvents/index.js';

// export {
//   versionlocation,
//   versionorganization,
//   versionpolicy,
//   versionquote,
//   versionsubmission,
//   versiontransaction,
// } from './firestoreEvents/versions/index.js';

// export {
//   amendmentlistener,
//   endorsementlistener,
//   getstaticmapimages,
//   getstaticpolicymapimages,
//   locationcancellistener,
//   markpaidonpaymentcomplete,
//   policycreatedlistener,
//   policyrenewallistener,
// } from './pubsub/index.js';

// export {
//   createtaxtransactions,
//   createtransfers,
//   markpolicypaid,
//   reversetaxtransactions,
//   reversetransfers,
// } from './pubsub/stripe/index.js';

// export {
//   authRequests,
//   authrequeststest,
//   copytaxes,
//   generatepdf,
//   quickbooks,
//   resend,
//   stripe,
// } from './routes/index.js';
// export { checkachstatus } from './scheduler/index.js';

// export {
//   getfips,
//   importpolicies,
//   importquotes,
//   importtransactions,
//   rateportfolio,
// } from './storageEvents/index.js';

// export { pubsubhelper } from './routes/index.js';
// // export { testEmulatorsCheckAchStatus } from './pubsub/checkAchStatus';
