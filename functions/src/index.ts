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

export {
  syncusersvisibleby,
  typesensesynclocations,
  typesensesyncorgs,
  typesensesyncpolicies,
  typesensesyncquotes,
  typesensesyncsubmissions,
  typesensesynctransactions,
  typesensesyncusers,
} from './firestoreEvents/algolia/index.js';
// npx firebase deploy --only functions:syncusersvisibleby,functions:typesensesynclocations,functions:typesensesyncorgs,functions:typesensesyncpolicies,functions:typesensesyncquotes,functions:typesensesyncsubmissions,functions:typesensesynctransactions,functions:typesensesyncusers

export {
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

// npx firebase deploy --only functions:createreceivableonpolicycreated,functions:createstripeaccount,functions:getstaticsubmissionimg,functions:getsubmissionaal,functions:getsubmissionfips,functions:locationcreated,functions:mirrorcustomclaims,functions:newagencyappnotification

// npx firebase deploy --only functions:newsubmissionnotifications,functions:policychangerequest,functions:sendinviteemail,functions:updatedocsonorgchange,functions:updatedocsonuserchange,functions:updateuseraccessonpolicychange,functions:updateuseraccessonquotechange

export {
  versionlocation,
  versionorganization,
  versionpolicy,
  versionquote,
  versionsubmission,
  versiontransaction,
} from './firestoreEvents/versions/index.js';

// npx firebase deploy --only functions:versionlocation,functions:versionorganization,functions:versionpolicy,functions:versionquote,functions:versionsubmission,functions:versiontransaction

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

// npx firebase deploy --only functions:amendmentlistener,functions:endorsementlistener,functions:getstaticmapimages,functions:getstaticpolicymapimages,functions:locationcancellistener,functions:markpaidonpaymentcomplete,functions:policycreatedlistener,functions:policyrenewallistener

export {
  createtaxtransactions,
  createtransfers,
  markpolicypaid,
  reversetaxtransactions,
  reversetransfers,
} from './pubsub/stripe/index.js';

// npx firebase deploy --only functions:createtaxtransactions,functions:createtransfers,functions:markpolicypaid,functions:reversetaxtransactions,functions:reversetransfers

export {
  authRequests,
  authrequeststest,
  copytaxes,
  generatepdf,
  quickbooks,
  resend,
  stripe,
} from './routes/index.js';
export { checkachstatus } from './scheduler/index.js';

// npx firebase deploy --only functions:authRequests,functions:authrequeststest,functions:copytaxes,functions:generatepdf,functions:quickbooks,functions:resend,functions:stripe,functions:checkachstatus

export {
  getfips,
  importpolicies,
  importquotes,
  importtransactions,
  rateportfolio,
} from './storageEvents/index.js';

export { pubsubhelper } from './routes/index.js';
// export { testEmulatorsCheckAchStatus } from './pubsub/checkAchStatus';

// npx firebase deploy --only functions:getfips,functions:importpolicies,functions:importquotes,functions:importtransactions,functions:rateportfolio
