export {};

// /**
//  * iDemand Insurance – Firestore Seed Script
//  *
//  * Generates realistic fake data that satisfies all cross-collection
//  * relationships described in the codebase schemas.
//  *
//  * Prerequisites
//  * -------------
//  * 1. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_PROJECT_ID env vars, OR
//  *    start the Firestore emulator and set:
//  *      FIRESTORE_EMULATOR_HOST=localhost:8082
//  *      GCLOUD_PROJECT=<your-project-id>
//  *
//  * Usage
//  * -----
//  *   node seed.js
//  *   node seed.js --count 5          # number of agencies/agents (default 3)
//  *   node seed.js --policies 10      # policies per agent (default 2)
//  *   node seed.js --dry-run          # print counts without writing
//  */

// import { faker } from '@faker-js/faker';
// import { add, differenceInCalendarDays, sub } from 'date-fns';
// import { cert, getApps, initializeApp } from 'firebase-admin/app';
// import { GeoPoint, getFirestore, Timestamp } from 'firebase-admin/firestore';
// import { customAlphabet } from 'nanoid';

// // ─────────────────────────────────────────────
// //  CLI flags
// // ─────────────────────────────────────────────
// const args = process.argv.slice(2);
// const flag = (name, def) => {
//   const i = args.indexOf(`--${name}`);
//   return i !== -1 ? (args[i + 1] ?? true) : def;
// };
// const DRY_RUN = flag('dry-run', false) !== false;
// const AGENCY_COUNT = parseInt(flag('count', '3'), 10);
// const POLICIES_PER_AGENT = parseInt(flag('policies', '2'), 10);

// // ─────────────────────────────────────────────
// //  Firebase init
// // ─────────────────────────────────────────────
// if (!getApps().length) {
//   if (process.env.FIRESTORE_EMULATOR_HOST) {
//     console.log(
//       `🔧  Connecting to Firestore emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`,
//     );
//     initializeApp({ projectId: process.env.GCLOUD_PROJECT || 'demo-project' });
//   } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
//     initializeApp({
//       credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
//     });
//   } else {
//     console.error(
//       '❌  Set FIRESTORE_EMULATOR_HOST (emulator) or GOOGLE_APPLICATION_CREDENTIALS.',
//     );
//     process.exit(1);
//   }
// }

// const db = getFirestore();

// // ─────────────────────────────────────────────
// //  ID factories
// // ─────────────────────────────────────────────
// const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
// const nanoId = customAlphabet(ALPHA, 9);
// const uid = () => nanoId();
// const policyId = () => `ID${customAlphabet(ALPHA, 8)()}`;
// const locationId = () => `loc_${nanoId()}`;
// const orgId = () => `org_${nanoId()}`;
// const agentId = () => `agt_${nanoId()}`;
// const userId = () => `usr_${nanoId()}`;
// const ratingId = () => `rat_${nanoId()}`;
// const trxId = (pol, loc, evt) => `${pol}-${loc}-${evt}`;

// // ─────────────────────────────────────────────
// //  Helpers
// // ─────────────────────────────────────────────
// const ts = (d) => Timestamp.fromDate(d instanceof Date ? d : new Date(d));
// const now = () => Timestamp.now();
// const baseMeta = (created) => ({
//   metadata: {
//     created: ts(created || new Date()),
//     updated: ts(created || new Date()),
//     version: 1,
//   },
// });

// const STATES = [
//   'FL',
//   'TX',
//   'CA',
//   'NY',
//   'LA',
//   'GA',
//   'SC',
//   'NC',
//   'VA',
//   'MD',
//   'NJ',
//   'MA',
//   'CT',
//   'AL',
//   'MS',
//   'TN',
//   'OH',
//   'IL',
//   'PA',
//   'CO',
// ];
// const FLOOD_ZONES = ['A', 'AE', 'X', 'V', 'VE', 'B', 'C'];
// const BASEMENTS = ['no', 'finished', 'unfinished', 'unknown'];
// const PRIOR_LOSS = ['0', '1', '2'];
// const PRODUCTS = ['flood'];
// const ISSUING_CARRIERS = [
//   'Rockingham Insurance Company',
//   'Rockingham Specialty, Inc.',
// ];

// function randomState() {
//   return faker.helpers.arrayElement(STATES);
// }

// function fakeAddress(state) {
//   const st = state || randomState();
//   return {
//     addressLine1: faker.location.streetAddress(),
//     addressLine2:
//       faker.helpers.maybe(() => faker.location.secondaryAddress(), {
//         probability: 0.2,
//       }) || '',
//     city: faker.location.city(),
//     state: st,
//     postal: faker.location.zipCode('#####'),
//     countyFIPS: faker.string.numeric(5),
//     countyName: `${faker.location.city()} County`,
//   };
// }

// function fakeCoordinates(state) {
//   // rough bounding boxes per state
//   const boxes = {
//     FL: { lat: [24.5, 30.9], lng: [-87.6, -80.0] },
//     TX: { lat: [25.8, 36.5], lng: [-106.6, -93.5] },
//     CA: { lat: [32.5, 42.0], lng: [-124.4, -114.1] },
//     NY: { lat: [40.4, 45.0], lng: [-79.8, -71.8] },
//   };
//   const box = boxes[state] || { lat: [25.0, 47.0], lng: [-124.0, -66.0] };
//   const lat = faker.number.float({
//     min: box.lat[0],
//     max: box.lat[1],
//     fractionDigits: 6,
//   });
//   const lng = faker.number.float({
//     min: box.lng[0],
//     max: box.lng[1],
//     fractionDigits: 6,
//   });
//   return { latitude: lat, longitude: lng };
// }

// function fakeLimits() {
//   const a = faker.helpers.arrayElement([
//     250000, 300000, 500000, 750000, 1000000,
//   ]);
//   const b = faker.helpers.arrayElement([0, 50000, 100000]);
//   const c = faker.helpers.arrayElement([0, 50000, 100000, 150000]);
//   const d = faker.helpers.arrayElement([0, 25000, 50000]);
//   return { limitA: a, limitB: b, limitC: c, limitD: d };
// }

// function fakeRCVs(limits) {
//   const rc = Math.max(limits.limitA * 1.1, 150000);
//   return {
//     building: Math.round(rc),
//     otherStructures: limits.limitB,
//     contents: limits.limitC,
//     BI: limits.limitD,
//     total: Math.round(rc) + limits.limitB + limits.limitC + limits.limitD,
//   };
// }

// function fakeDeductible() {
//   return faker.helpers.arrayElement([1000, 2500, 5000, 10000, 25000]);
// }

// function fakePremiumCalc(limits, commPct = 0.15) {
//   const tiv = limits.limitA + limits.limitB + limits.limitC + limits.limitD;
//   const inlandAAL = faker.number.float({
//     min: 200,
//     max: 8000,
//     fractionDigits: 2,
//   });
//   const surgeAAL = faker.number.float({
//     min: 50,
//     max: 3000,
//     fractionDigits: 2,
//   });
//   const tsunamiAAL = faker.number.float({ min: 0, max: 10, fractionDigits: 2 });

//   const inlandTech = Math.round(inlandAAL * 1.1 * 100) / 100;
//   const surgeTech = Math.round(surgeAAL * 1.15 * 100) / 100;
//   const tsunamiTech = Math.round(tsunamiAAL * 1.15 * 100) / 100;
//   const techTotal = inlandTech + surgeTech + tsunamiTech;

//   const stateMultInland = 1.5;
//   const stateMultSurge = 2.5;
//   const stateMultTsunami = 1.0;

//   const inlandPrem = inlandTech * stateMultInland * (1 / (1 - 0.3735));
//   const surgePrem = surgeTech * stateMultSurge * (1 / (1 - 0.3735));
//   const tsunamiPrem = tsunamiTech * stateMultTsunami * (1 / (1 - 0.3735));

//   const subtotal = inlandPrem + surgePrem + tsunamiPrem;
//   const minPrem = Math.max(300, Math.round(tiv * 0.0004));
//   const provisional = Math.ceil(Math.max(subtotal, minPrem));
//   const subprodAdj = provisional * (commPct - 0.15);
//   const annualPremium = Math.ceil(provisional + subprodAdj);
//   const mgaCommPct = 0.3;
//   const mgaComm = Math.round(annualPremium * mgaCommPct * 100) / 100;

//   return {
//     AALs: { inland: inlandAAL, surge: surgeAAL, tsunami: tsunamiAAL },
//     premiumCalcData: {
//       techPremium: {
//         inland: inlandTech,
//         surge: surgeTech,
//         tsunami: tsunamiTech,
//         total: techTotal,
//       },
//       floodCategoryPremium: {
//         inland: inlandPrem,
//         surge: surgePrem,
//         tsunami: tsunamiPrem,
//       },
//       premiumSubtotal: subtotal,
//       provisionalPremium: provisional,
//       subproducerAdj: subprodAdj,
//       subproducerCommissionPct: commPct,
//       minPremium: minPrem,
//       minPremiumAdj: Math.max(0, minPrem - subtotal),
//       annualPremium,
//       MGACommission: mgaComm,
//       MGACommissionPct: mgaCommPct,
//     },
//   };
// }

// function calcTerm(annualPrem, effDate, expDate) {
//   const termDays = differenceInCalendarDays(expDate, effDate);
//   const yearDays = 365;
//   const termPremium =
//     Math.round((termDays / yearDays) * annualPrem * 100) / 100;
//   const dailyPremium = Math.round((termPremium / termDays) * 100) / 100;
//   return { termDays, termPremium, dailyPremium };
// }

// function fakeTaxes(premium, state) {
//   const rate = faker.number.float({ min: 0.01, max: 0.06, fractionDigits: 4 });
//   const value = Math.round(premium * rate * 100) / 100;
//   return [
//     {
//       displayName: 'Premium Tax',
//       rate,
//       value,
//       state,
//       subjectBase: ['premium'],
//       subjectBaseAmount: premium,
//       baseDigits: 2,
//       resultDigits: 2,
//       resultRoundType: 'nearest',
//       taxId: `tax_${nanoId()}`,
//       taxCalcId: `tc_${nanoId()}`,
//       refundable: true,
//       transactionTypes: [
//         'new',
//         'endorsement',
//         'amendment',
//         'cancellation',
//         'flat_cancel',
//         'reinstatement',
//         'renewal',
//       ],
//       expirationDate: ts(new Date('2050-01-01')),
//       calcDate: now(),
//     },
//   ];
// }

// function fakeFees() {
//   const mgaFee = faker.helpers.arrayElement([150, 200, 250, 300]);
//   const inspFee = faker.helpers.arrayElement([50, 75, 100]);
//   return [
//     { displayName: 'MGA Fee', value: mgaFee, refundable: true },
//     { displayName: 'Inspection Fee', value: inspFee, refundable: false },
//   ];
// }

// function fakeRatingPropertyData(state) {
//   return {
//     CBRSDesignation: faker.helpers.arrayElement(['IN', 'OUT', null]),
//     basement: faker.helpers.arrayElement(BASEMENTS),
//     distToCoastFeet: faker.number.int({ min: 500, max: 50000 }),
//     floodZone: faker.helpers.arrayElement(FLOOD_ZONES),
//     numStories: faker.helpers.arrayElement([1, 1, 2, 2, 3]),
//     propertyCode: faker.helpers.arrayElement(['SFR', 'CONDO', 'MFR', null]),
//     replacementCost: faker.number.int({ min: 150000, max: 800000 }),
//     sqFootage: faker.number.int({ min: 800, max: 5000 }),
//     yearBuilt: faker.number.int({ min: 1960, max: 2020 }),
//     FFH: faker.helpers.arrayElement([0, 1, 2, 3, null]),
//     priorLossCount: faker.helpers.arrayElement(PRIOR_LOSS),
//     units: faker.helpers.arrayElement([1, null]),
//     elevation: faker.number.float({ min: -2, max: 20, fractionDigits: 1 }),
//   };
// }

// // ─────────────────────────────────────────────
// //  Batch writer wrapper
// // ─────────────────────────────────────────────
// class BatchWriter {
//   constructor(db) {
//     this.db = db;
//     this.batch = db.batch();
//     this.count = 0;
//     this.total = 0;
//   }

//   set(ref, data) {
//     if (DRY_RUN) {
//       this.total++;
//       return;
//     }
//     this.batch.set(ref, data);
//     this.count++;
//     this.total++;
//     if (this.count >= 450) this._flush();
//   }

//   async _flush() {
//     if (!DRY_RUN && this.count > 0) {
//       await this.batch.commit();
//       this.batch = this.db.batch();
//       this.count = 0;
//     }
//   }

//   async commit() {
//     await this._flush();
//   }
// }

// // ════════════════════════════════════════════
// //  SEED FUNCTIONS
// // ════════════════════════════════════════════

// async function seedIdemandOrg(bw) {
//   const id = 'idemand';
//   const ref = db.collection('organizations').doc(id);
//   const created = sub(new Date(), { months: 24 });
//   bw.set(ref, {
//     type: 'agency',
//     orgId: id,
//     orgName: 'iDemand Insurance Agency, Inc.',
//     tenantId: null,
//     stripeAccountId: `acct_idemand_${nanoId()}`, // need to use real stripeId
//     status: 'active',
//     address: {
//       addressLine1: '6017 Pine Ridge Rd., Suite 401',
//       addressLine2: '',
//       city: 'Naples',
//       state: 'FL',
//       postal: '34119',
//     },
//     emailDomains: ['@idemandinsurance.com'],
//     enforceDomainRestriction: false,
//     authProviders: ['password'],
//     defaultCommission: { flood: 0.15, wind: 0.15 },
//     photoURL: null,
//     website: 'https://portfolio.s-carlson.com',
//     ...baseMeta(created),
//   });
//   console.log('  ✔  iDemand org seeded');
// }

// async function seedIdemandAdmin(bw) {
//   const id = `admin_${nanoId()}`;
//   const email = 'admin@idemandinsurance.com';
//   const created = sub(new Date(), { months: 24 });
//   const userRef = db.collection('users').doc(id);
//   bw.set(userRef, {
//     displayName: 'iDemand Admin',
//     firstName: 'iDemand',
//     lastName: 'Admin',
//     email,
//     phone: '2395550100',
//     orgId: 'idemand',
//     tenantId: null,
//     ...baseMeta(created),
//   });

//   // userClaims
//   const claimsRef = db
//     .collection('organizations')
//     .doc('idemand')
//     .collection('userClaims')
//     .doc(id);
//   bw.set(claimsRef, {
//     iDemandAdmin: true,
//     iDemandUser: true,
//     _lastCommitted: now(),
//   });

//   console.log(`  ✔  iDemand admin user: ${id}`);
//   return { id, email };
// }

// async function seedAgency(bw, index) {
//   const state = randomState();
//   const tenantId = `tenant_${nanoId()}`;
//   const oid = `org_${nanoId()}`;
//   const stripeAcct = `acct_${nanoId()}`;
//   const created = sub(new Date(), {
//     months: faker.number.int({ min: 3, max: 18 }),
//   });

//   const orgRef = db.collection('organizations').doc(oid);
//   bw.set(orgRef, {
//     type: 'agency',
//     orgId: oid,
//     orgName: `${faker.company.name()} Insurance`,
//     tenantId,
//     stripeAccountId: stripeAcct,
//     status: 'active',
//     address: fakeAddress(state),
//     FEIN: faker.string.numeric(9),
//     emailDomains: [`${faker.internet.domainName()}`],
//     enforceDomainRestriction: false,
//     authProviders: ['password'],
//     defaultCommission: { flood: 0.15, wind: 0.15 },
//     photoURL: null,
//     website: faker.internet.url(),
//     ...baseMeta(created),
//   });

//   console.log(`  ✔  Agency [${index + 1}/${AGENCY_COUNT}]: ${oid}`);
//   return { oid, tenantId, stripeAcct, state, created };
// }

// async function seedAgent(bw, { oid, tenantId, stripeAcct, state, created }) {
//   const aid = agentId();
//   const email = faker.internet.email().toLowerCase();
//   const firstName = faker.person.firstName();
//   const lastName = faker.person.lastName();

//   const userRef = db.collection('users').doc(aid);
//   bw.set(userRef, {
//     displayName: `${firstName} ${lastName}`,
//     firstName,
//     lastName,
//     email,
//     phone: faker.phone.number('##########'),
//     orgId: oid,
//     tenantId,
//     defaultCommission: { flood: 0.15, wind: 0.15 },
//     ...baseMeta(created),
//   });

//   // userClaims under org
//   const claimsRef = db
//     .collection('organizations')
//     .doc(oid)
//     .collection('userClaims')
//     .doc(aid);
//   bw.set(claimsRef, { agent: true, orgAdmin: false, _lastCommitted: now() });

//   // invitation record (accepted)
//   const invRef = db
//     .collection('organizations')
//     .doc(oid)
//     .collection('invitations')
//     .doc(email);
//   bw.set(invRef, {
//     email,
//     displayName: `${firstName} ${lastName}`,
//     firstName,
//     lastName,
//     orgId: oid,
//     orgName: 'Agency',
//     customClaims: { agent: true },
//     status: 'accepted',
//     sent: true,
//     id: invRef.id,
//     invitedBy: { email: 'admin@idemandinsurance.com' },
//     ...baseMeta(created),
//   });

//   return {
//     aid,
//     email,
//     firstName,
//     lastName,
//     phone: faker.phone.number('##########'),
//     oid,
//     tenantId,
//     stripeAcct,
//     state,
//   };
// }

// async function seedOrgAdmin(bw, { oid, tenantId, state, created }) {
//   const id = userId();
//   const email = faker.internet.email().toLowerCase();
//   const firstName = faker.person.firstName();
//   const lastName = faker.person.lastName();

//   bw.set(db.collection('users').doc(id), {
//     displayName: `${firstName} ${lastName}`,
//     firstName,
//     lastName,
//     email,
//     phone: faker.phone.number('##########'),
//     orgId: oid,
//     tenantId,
//     ...baseMeta(created),
//   });

//   bw.set(
//     db.collection('organizations').doc(oid).collection('userClaims').doc(id),
//     { orgAdmin: true, agent: false, _lastCommitted: now() },
//   );

//   return { id, email, firstName, lastName };
// }

// async function seedInsuredUser(bw, created) {
//   const id = userId();
//   const email = faker.internet.email().toLowerCase();
//   bw.set(db.collection('users').doc(id), {
//     displayName: faker.person.fullName(),
//     email,
//     phone: faker.phone.number('##########'),
//     orgId: null,
//     tenantId: null,
//     ...baseMeta(created),
//   });
//   return { id, email };
// }

// async function seedRatingDoc(
//   bw,
//   {
//     limits,
//     rcvs,
//     deductible,
//     coords,
//     ratingPropData,
//     premCalc,
//     locationDocId,
//     state,
//   },
// ) {
//   const rid = ratingId();
//   const ref = db.collection('ratingData').doc(rid);
//   const tiv = limits.limitA + limits.limitB + limits.limitC + limits.limitD;
//   bw.set(ref, {
//     submissionId: null,
//     locationId: locationDocId,
//     limits,
//     TIV: tiv,
//     deductible,
//     RCVs: rcvs,
//     ratingPropertyData: ratingPropData,
//     AALs: premCalc.AALs,
//     premiumCalcData: premCalc.premiumCalcData,
//     coordinates: new GeoPoint(coords.latitude, coords.longitude),
//     ...baseMeta(new Date()),
//   });
//   return rid;
// }

// async function seedLocation(
//   bw,
//   {
//     locationDocId,
//     policyDocId,
//     agentInfo,
//     insuredUser,
//     limits,
//     rcvs,
//     deductible,
//     coords,
//     ratingPropData,
//     ratingDocId,
//     effDate,
//     expDate,
//     termPremium,
//     termDays,
//     annualPremium,
//     fees,
//     taxes,
//     state,
//   },
// ) {
//   const ref = db.collection('locations').doc(locationDocId);
//   const address = { ...fakeAddress(state), ...{ state } };
//   bw.set(ref, {
//     parentType: 'policy',
//     address,
//     coordinates: new GeoPoint(coords.latitude, coords.longitude),
//     geoHash: `u${faker.string.alphanumeric(8)}`,
//     annualPremium,
//     termPremium,
//     termDays,
//     limits,
//     TIV: limits.limitA + limits.limitB + limits.limitC + limits.limitD,
//     RCVs: rcvs,
//     deductible,
//     additionalInsureds: [],
//     mortgageeInterest: [],
//     ratingDocId,
//     ratingPropertyData: ratingPropData,
//     effectiveDate: ts(effDate),
//     expirationDate: ts(expDate),
//     cancelEffDate: null,
//     cancelReason: null,
//     imageURLs: null,
//     imagePaths: null,
//     locationId: locationDocId,
//     policyId: policyDocId,
//     externalId: `EXT-${faker.string.alphanumeric(8).toUpperCase()}`,
//     ...baseMeta(effDate),
//   });
//   return ref;
// }

// async function seedPolicy(
//   bw,
//   {
//     policyDocId,
//     agent,
//     insuredUser,
//     orgData,
//     locationDocId,
//     limits,
//     termPremium,
//     annualPremium,
//     state,
//     effDate,
//     expDate,
//     fees,
//     taxes,
//     termDays,
//     ratingDocId,
//   },
// ) {
//   const namedInsured = {
//     displayName: `${faker.person.firstName()} ${faker.person.lastName()}`,
//     firstName: faker.person.firstName(),
//     lastName: faker.person.lastName(),
//     email: insuredUser.email,
//     phone: faker.phone.number('##########'),
//     userId: insuredUser.id,
//     orgId: null,
//   };

//   const mailingAddress = {
//     ...fakeAddress(state),
//     name: namedInsured.displayName,
//   };

//   const taxTotal = taxes.reduce((s, t) => s + t.value, 0);
//   const feeTotal = fees.reduce((s, f) => s + f.value, 0);
//   const price = termPremium + taxTotal + feeTotal;

//   const billingEntityId = insuredUser.id;
//   const billingEntities = {
//     [billingEntityId]: {
//       displayName: namedInsured.displayName,
//       email: namedInsured.email,
//       phone: namedInsured.phone,
//       billingType: 'invoice',
//       selectedPaymentMethodId: null,
//       paymentMethods: [],
//     },
//   };

//   const policyLoc = {
//     termPremium,
//     annualPremium,
//     address: {
//       s1: faker.location.streetAddress(),
//       s2: '',
//       c: faker.location.city(),
//       st: state,
//       p: faker.location.zipCode('#####'),
//     },
//     coords: new GeoPoint(
//       faker.number.float({ min: 25, max: 45, fractionDigits: 6 }),
//       faker.number.float({ min: -125, max: -66, fractionDigits: 6 }),
//     ),
//     billingEntityId,
//   };

//   const carrier = {
//     name: faker.helpers.arrayElement(ISSUING_CARRIERS),
//     orgId: 'carrier_rockingham',
//     stripeAccountId: `acct_rock_${nanoId()}`,
//     address: {
//       addressLine1: '633 East Main St.',
//       addressLine2: '',
//       city: 'Harrisonburg',
//       state: 'VA',
//       postal: '22801',
//     },
//   };

//   const ref = db.collection('policies').doc(policyDocId);
//   bw.set(ref, {
//     product: 'flood',
//     paymentStatus: 'paid',
//     term: 1,
//     namedInsured,
//     mailingAddress,
//     locations: { [locationDocId]: policyLoc },
//     homeState: state,
//     termPremium,
//     termPremiumWithCancels: termPremium,
//     inStatePremium: termPremium,
//     outStatePremium: 0,
//     termDays,
//     totalsByBillingEntity: {
//       [billingEntityId]: {
//         termPremium,
//         taxes,
//         fees,
//         price,
//       },
//     },
//     fees,
//     taxes,
//     price,
//     effectiveDate: ts(effDate),
//     expirationDate: ts(expDate),
//     cancelEffDate: null,
//     cancelReason: null,
//     userId: insuredUser.id,
//     agent: {
//       name: `${agent.firstName} ${agent.lastName}`,
//       email: agent.email,
//       phone: agent.phone || '2395550100',
//       userId: agent.aid,
//     },
//     agency: {
//       name: orgData.orgName,
//       orgId: orgData.oid,
//       stripeAccountId: orgData.stripeAcct,
//       address: orgData.address || fakeAddress(state),
//     },
//     billingEntities,
//     defaultBillingEntityId: billingEntityId,
//     surplusLinesProducerOfRecord: {
//       name: 'John Surplus',
//       licenseNum: `SL${faker.string.numeric(8)}`,
//       licenseState: state,
//       phone: faker.phone.number('##########'),
//     },
//     issuingCarrier: carrier.name,
//     carrier,
//     commSource: 'default',
//     quoteId: null,
//     externalId: null,
//     documents: [],
//     ...baseMeta(effDate),
//   });

//   return ref;
// }

// async function seedPremiumTransaction(
//   bw,
//   {
//     policyDocId,
//     locationDocId,
//     policyRef,
//     locationRef,
//     agent,
//     orgData,
//     insuredUser,
//     state,
//     effDate,
//     expDate,
//     limits,
//     rcvs,
//     deductible,
//     ratingPropData,
//     termPremium,
//     dailyPremium,
//     termDays,
//     annualPremium,
//     premCalcData,
//     fees,
//     taxes,
//   },
// ) {
//   const eventId = `evt_${nanoId()}`;
//   const tid = trxId(policyDocId, locationDocId, eventId);
//   const ref = db.collection('transactions').doc(tid);

//   const tiv = limits.limitA + limits.limitB + limits.limitC + limits.limitD;
//   const mgaComm = premCalcData.MGACommission;
//   const mgaCommPct = premCalcData.MGACommissionPct;
//   const netDWP = termPremium - mgaComm;

//   const taxTotal = taxes.reduce((s, t) => s + t.value, 0);
//   const feeTotal = fees.reduce((s, f) => s + f.value, 0);
//   const price = termPremium + taxTotal + feeTotal;

//   const billingEntityId = insuredUser.id;

//   bw.set(ref, {
//     trxType: 'new',
//     trxInterfaceType: 'premium',
//     product: 'flood',
//     policyId: policyDocId,
//     locationId: locationDocId,
//     externalId: null,
//     term: 1,
//     bookingDate: ts(effDate),
//     issuingCarrier: faker.helpers.arrayElement(ISSUING_CARRIERS),
//     namedInsured: `${faker.person.firstName()} ${faker.person.lastName()}`,
//     mailingAddress: { ...fakeAddress(state), name: 'Insured Name' },
//     agent: {
//       name: `${agent.firstName} ${agent.lastName}`,
//       email: agent.email,
//       phone: agent.phone || '2395550100',
//       userId: agent.aid,
//     },
//     agency: {
//       name: orgData.orgName,
//       orgId: orgData.oid,
//       stripeAccountId: orgData.stripeAcct,
//       address: orgData.address || fakeAddress(state),
//     },
//     homeState: state,
//     policyEffDate: ts(effDate),
//     policyExpDate: ts(expDate),
//     trxEffDate: ts(effDate),
//     trxExpDate: ts(expDate),
//     trxDays: termDays,
//     insuredLocation: {
//       // embedded snapshot
//       parentType: 'policy',
//       address: fakeAddress(state),
//       coordinates: new GeoPoint(
//         faker.number.float({ min: 25, max: 45, fractionDigits: 6 }),
//         faker.number.float({ min: -125, max: -66, fractionDigits: 6 }),
//       ),
//       geoHash: `u${faker.string.alphanumeric(8)}`,
//       annualPremium,
//       termPremium,
//       termDays,
//       limits,
//       TIV: tiv,
//       RCVs: rcvs,
//       deductible,
//       additionalInsureds: [],
//       mortgageeInterest: [],
//       ratingDocId: `rat_${nanoId()}`,
//       ratingPropertyData: ratingPropData,
//       effectiveDate: ts(effDate),
//       expirationDate: ts(expDate),
//       cancelEffDate: null,
//       cancelReason: null,
//       locationId: locationDocId,
//       policyId: policyDocId,
//       externalId: null,
//     },
//     ratingPropertyData: {
//       ...ratingPropData,
//       units: 1,
//       tier1: false,
//       construction: 'frame',
//     },
//     deductible,
//     limits,
//     TIV: tiv,
//     RCVs: rcvs,
//     premiumCalcData: premCalcData,
//     locationAnnualPremium: annualPremium,
//     termPremium,
//     MGACommission: mgaComm,
//     MGACommissionPct: mgaCommPct,
//     netDWP,
//     dailyPremium,
//     termProratedPct: termDays / 365,
//     netErrorAdj: 0,
//     surplusLinesTax:
//       taxes.find((t) => t.displayName === 'Premium Tax')?.value || 0,
//     surplusLinesRegulatoryFee: 0,
//     MGAFee: fees.find((f) => f.displayName === 'MGA Fee')?.value || 0,
//     inspectionFee:
//       fees.find((f) => f.displayName === 'Inspection Fee')?.value || 0,
//     otherInterestedParties: [],
//     additionalNamedInsured: [],
//     billingEntityId,
//     billingEntity: {
//       displayName: 'Insured',
//       email: insuredUser.email,
//       phone: '2395550100',
//       billingType: 'invoice',
//       paymentMethods: [],
//     },
//     billingEntityTotals: {
//       termPremium,
//       taxes,
//       fees,
//       price,
//     },
//     eventId,
//     ...baseMeta(effDate),
//   });

//   return tid;
// }

// async function seedSubmission(bw, { agent, orgData, state }) {
//   const sid = `sub_${nanoId()}`;
//   const created = sub(new Date(), {
//     days: faker.number.int({ min: 5, max: 60 }),
//   });
//   const limits = fakeLimits();
//   const coords = fakeCoordinates(state);
//   const address = fakeAddress(state);

//   bw.set(db.collection('submissions').doc(sid), {
//     product: 'flood',
//     address: {
//       ...address,
//       countyFIPS: faker.string.numeric(5),
//       countyName: `${faker.location.city()} County`,
//     },
//     coordinates: new GeoPoint(coords.latitude, coords.longitude),
//     limits,
//     deductible: fakeDeductible(),
//     exclusionsExist: false,
//     exclusions: [],
//     priorLossCount: faker.helpers.arrayElement(PRIOR_LOSS),
//     contact: {
//       firstName: faker.person.firstName(),
//       lastName: faker.person.lastName(),
//       email: faker.internet.email().toLowerCase(),
//       userId: null,
//     },
//     userAcceptance: true,
//     homeState: state,
//     ratingPropertyData: fakeRatingPropertyData(state),
//     propertyDataDocId: null,
//     rcvSourceUser: null,
//     status: faker.helpers.arrayElement(['submitted', 'quoted', 'under_review']),
//     agent: {
//       name: `${agent.firstName} ${agent.lastName}`,
//       email: agent.email,
//       phone: agent.phone || '',
//       userId: agent.aid,
//     },
//     agency: {
//       name: orgData.orgName,
//       orgId: orgData.oid,
//       stripeAccountId: orgData.stripeAcct,
//       address: orgData.address || fakeAddress(state),
//     },
//     commSource: 'default',
//     ...baseMeta(created),
//   });

//   return sid;
// }

// async function seedQuote(bw, { agent, orgData, insuredUser, state }) {
//   const qid = `QT${nanoId()}`;
//   const created = sub(new Date(), {
//     days: faker.number.int({ min: 1, max: 30 }),
//   });
//   const effDate = add(new Date(), {
//     days: faker.number.int({ min: 1, max: 30 }),
//   });
//   const expDate = add(effDate, { years: 1 });
//   const limits = fakeLimits();
//   const rcvs = fakeRCVs(limits);
//   const deductible = fakeDeductible();
//   const ratingPropData = fakeRatingPropertyData(state);
//   const { AALs, premiumCalcData } = fakePremiumCalc(limits);
//   const annualPremium = premiumCalcData.annualPremium;
//   const fees = fakeFees();
//   const taxes = fakeTaxes(annualPremium, state);
//   const rid = ratingId();
//   const coords = fakeCoordinates(state);
//   const address = fakeAddress(state);

//   // rating doc
//   bw.set(db.collection('ratingData').doc(rid), {
//     submissionId: null,
//     locationId: null,
//     limits,
//     TIV: limits.limitA + limits.limitB + limits.limitC + limits.limitD,
//     deductible,
//     RCVs: rcvs,
//     ratingPropertyData: ratingPropData,
//     AALs,
//     premiumCalcData,
//     coordinates: new GeoPoint(coords.latitude, coords.longitude),
//     ...baseMeta(created),
//   });

//   const quoteTotal =
//     annualPremium +
//     taxes.reduce((s, t) => s + t.value, 0) +
//     fees.reduce((s, f) => s + f.value, 0);
//   const cardFee = Math.round(quoteTotal * 0.035 * 100) / 100;

//   bw.set(db.collection('quotes').doc(qid), {
//     policyId: policyId(),
//     product: 'flood',
//     deductible,
//     limits,
//     address,
//     homeState: state,
//     coordinates: new GeoPoint(coords.latitude, coords.longitude),
//     fees,
//     taxes,
//     annualPremium,
//     subproducerCommission: premiumCalcData.subproducerCommissionPct,
//     cardFee,
//     quoteTotal,
//     effectiveDate: ts(effDate),
//     quotePublishedDate: ts(created),
//     quoteExpirationDate: ts(add(created, { days: 30 })),
//     exclusions: [],
//     additionalInterests: [],
//     userId: insuredUser.id,
//     namedInsured: {
//       firstName: faker.person.firstName(),
//       lastName: faker.person.lastName(),
//       email: insuredUser.email,
//       phone: faker.phone.number('##########'),
//       userId: insuredUser.id,
//     },
//     mailingAddress: { ...fakeAddress(state), name: faker.person.fullName() },
//     agent: {
//       name: `${agent.firstName} ${agent.lastName}`,
//       email: agent.email,
//       phone: agent.phone || '',
//       userId: agent.aid,
//     },
//     agency: {
//       name: orgData.orgName,
//       orgId: orgData.oid,
//       stripeAccountId: orgData.stripeAcct,
//       address: orgData.address || fakeAddress(state),
//     },
//     carrier: {
//       name: faker.helpers.arrayElement(ISSUING_CARRIERS),
//       orgId: 'carrier_rockingham',
//       stripeAccountId: `acct_rock_${nanoId()}`,
//       address: null,
//     },
//     billingEntities: {},
//     defaultBillingEntityId: 'namedInsured',
//     status: faker.helpers.arrayElement(['awaiting:user', 'bound', 'expired']),
//     ratingPropertyData: ratingPropData,
//     ratingDocId: rid,
//     geoHash: null,
//     commSource: 'default',
//     ...baseMeta(created),
//   });

//   return qid;
// }

// // ════════════════════════════════════════════
// //  MAIN
// // ════════════════════════════════════════════
// async function main() {
//   console.log('\n🌱  iDemand Firestore Seed');
//   console.log(`   Agencies:         ${AGENCY_COUNT}`);
//   console.log(`   Policies/agent:   ${POLICIES_PER_AGENT}`);
//   console.log(`   Dry run:          ${DRY_RUN}\n`);

//   const bw = new BatchWriter(db);

//   // ── iDemand org + admin ──────────────────
//   await seedIdemandOrg(bw);
//   await seedIdemandAdmin(bw);

//   let totalPolicies = 0;
//   let totalTransactions = 0;
//   let totalLocations = 0;
//   let totalRatingDocs = 0;
//   let totalSubmissions = 0;
//   let totalQuotes = 0;
//   let totalUsers = 0;

//   // ── Agencies ──────────────────────────────
//   for (let ai = 0; ai < AGENCY_COUNT; ai++) {
//     const agencyData = await seedAgency(bw, ai);
//     const orgData = {
//       oid: agencyData.oid,
//       orgName: `Agency ${ai + 1}`,
//       stripeAcct: agencyData.stripeAcct,
//       address: fakeAddress(agencyData.state),
//     };

//     // Org admin
//     await seedOrgAdmin(bw, agencyData);
//     totalUsers++;

//     // Agents (1-2 per agency)
//     const agentCount = faker.number.int({ min: 1, max: 2 });
//     for (let agi = 0; agi < agentCount; agi++) {
//       const agent = await seedAgent(bw, agencyData);
//       totalUsers++;

//       // Submissions
//       const subCount = faker.number.int({ min: 1, max: 3 });
//       for (let si = 0; si < subCount; si++) {
//         await seedSubmission(bw, { agent, orgData, state: agencyData.state });
//         totalSubmissions++;
//       }

//       // Policies
//       for (let pi = 0; pi < POLICIES_PER_AGENT; pi++) {
//         const insuredUser = await seedInsuredUser(bw, new Date());
//         totalUsers++;

//         const state = agencyData.state;
//         const limits = fakeLimits();
//         const rcvs = fakeRCVs(limits);
//         const deductible = fakeDeductible();
//         const ratingPropData = fakeRatingPropertyData(state);
//         const coords = fakeCoordinates(state);
//         const { AALs, premiumCalcData } = fakePremiumCalc(limits);
//         const annualPremium = premiumCalcData.annualPremium;
//         const fees = fakeFees();
//         const taxes = fakeTaxes(annualPremium, state);

//         const daysAgo = faker.number.int({ min: 10, max: 300 });
//         const effDate = sub(new Date(), { days: daysAgo });
//         const expDate = add(effDate, { years: 1 });
//         const { termPremium, termDays, dailyPremium } = calcTerm(
//           annualPremium,
//           effDate,
//           expDate,
//         );

//         const policyDocId = policyId();
//         const locationDocId = locationId();

//         // Rating doc
//         const ratingDocId = await seedRatingDoc(bw, {
//           limits,
//           rcvs,
//           deductible,
//           coords,
//           ratingPropData,
//           premCalc: { AALs, premiumCalcData },
//           locationDocId,
//           state,
//         });
//         totalRatingDocs++;

//         // Location doc
//         await seedLocation(bw, {
//           locationDocId,
//           policyDocId,
//           agentInfo: agent,
//           insuredUser,
//           limits,
//           rcvs,
//           deductible,
//           coords,
//           ratingPropData,
//           ratingDocId,
//           effDate,
//           expDate,
//           termPremium,
//           termDays,
//           annualPremium,
//           fees,
//           taxes,
//           state,
//         });
//         totalLocations++;

//         // Policy doc
//         await seedPolicy(bw, {
//           policyDocId,
//           agent,
//           insuredUser,
//           orgData,
//           locationDocId,
//           limits,
//           termPremium,
//           annualPremium,
//           state,
//           effDate,
//           expDate,
//           fees,
//           taxes,
//           termDays,
//           ratingDocId,
//         });
//         totalPolicies++;

//         // Premium transaction
//         await seedPremiumTransaction(bw, {
//           policyDocId,
//           locationDocId,
//           agent,
//           orgData,
//           insuredUser,
//           state,
//           effDate,
//           expDate,
//           limits,
//           rcvs,
//           deductible,
//           ratingPropData,
//           termPremium,
//           dailyPremium,
//           termDays,
//           annualPremium,
//           premCalcData: premiumCalcData,
//           fees,
//           taxes,
//         });
//         totalTransactions++;

//         // Quote (1 per policy)
//         await seedQuote(bw, { agent, orgData, insuredUser, state });
//         totalQuotes++;
//       }
//     }
//   }

//   await bw.commit();

//   console.log('\n📊  Seed summary');
//   console.log(`   Users:            ${totalUsers + 2}`);
//   console.log(`   Agencies:         ${AGENCY_COUNT}`);
//   console.log(`   Submissions:      ${totalSubmissions}`);
//   console.log(`   Quotes:           ${totalQuotes}`);
//   console.log(`   Policies:         ${totalPolicies}`);
//   console.log(`   Locations:        ${totalLocations}`);
//   console.log(`   Rating docs:      ${totalRatingDocs}`);
//   console.log(`   Transactions:     ${totalTransactions}`);
//   console.log(`   Total writes:     ${bw.total}`);
//   console.log(
//     DRY_RUN
//       ? '\n⚠️   DRY RUN – nothing written to Firestore.\n'
//       : '\n✅  Done!\n',
//   );
// }

// main().catch((err) => {
//   console.error('❌  Seed failed:', err);
//   process.exit(1);
// });
