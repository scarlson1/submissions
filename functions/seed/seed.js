/**
 * Firestore Seed Script
 *
 * Populates Firestore with realistic fake data respecting all
 * cross-collection relationships in the iDemand codebase.
 *
 * When STRIPE_SECRET_KEY is provided (recommended), the script calls
 * the Stripe sandbox API to create real Customer and Connect Account
 * objects so IDs are genuine test-mode resources.
 * Without the key, plausible-looking placeholder IDs are used instead.
 *
 * ─── Collections seeded ───────────────────────────────────────────────
 *  organizations           taxes (config)        disclosures
 *  organizations/…/userClaims                    moratoriums
 *  organizations/…/invitations                   licenses
 *  users                   submissions            quotes
 *  ratingData              locations              policies
 *  policies/…/changeRequests                     policies/…/claims
 *  transactions            receivables            financialTransactions
 *  agencySubmissions       emailActivity          dataImports
 *  dataImports/…/stagedDocs
 *
 * ─── Prerequisites ────────────────────────────────────────────────────
 *  Place this file inside functions/ (or a sub-folder).
 *  It shares the functions package so no extra install is needed for
 *  firebase-admin. Add stripe if you want real Stripe IDs:
 *    cd functions && npm install stripe   (already there if you use Stripe)
 *
 *  Then run:
 *    # Emulator
 *    FIRESTORE_EMULATOR_HOST=localhost:8082 \
 *    GCLOUD_PROJECT=demo-project \
 *    STRIPE_SECRET_KEY=sk_test_… \
 *    node seed/seed.js
 *
 *    # Production service account
 *    GOOGLE_APPLICATION_CREDENTIALS=/path/sa.json \
 *    STRIPE_SECRET_KEY=sk_test_… \
 *    node seed/seed.js
 *
 * ─── Flags ────────────────────────────────────────────────────────────
 *  --count   N   agencies to create      (default 3)
 *  --policies N  policies per agent       (default 2)
 *  --dry-run     count writes, skip I/O
 *  --reset       delete seeded collections first
 */

import { faker } from '@faker-js/faker';
import { add, differenceInCalendarDays, sub } from 'date-fns';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { GeoPoint, getFirestore, Timestamp } from 'firebase-admin/firestore';
import { customAlphabet } from 'nanoid';

// ═══════════════════════════════════════════════════════
//  CLI FLAGS
// ═══════════════════════════════════════════════════════
const args = process.argv.slice(2);
const flag = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 ? (args[i + 1] ?? true) : def;
};
const DRY_RUN = flag('dry-run', false) !== false;
const DO_RESET = flag('reset', false) !== false;
const AGENCY_COUNT = parseInt(flag('count', '3'), 10);
const POLICIES_PER_AGENT = parseInt(flag('policies', '2'), 10);

// ═══════════════════════════════════════════════════════
//  STRIPE (optional – real sandbox IDs when key provided)
// ═══════════════════════════════════════════════════════
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY || '';
let stripe = null;
if (STRIPE_KEY) {
  try {
    const { default: Stripe } = await import('stripe');
    stripe = new Stripe(STRIPE_KEY, { apiVersion: '2023-10-16' });
    console.log('💳  Stripe connected – real sandbox IDs will be used');
  } catch {
    console.warn('⚠️   stripe package not found – using placeholder IDs');
  }
}

/** Creates a real Stripe Customer in test mode, or returns a placeholder */
async function getStripeCustomer(email, name, phone) {
  if (stripe && !DRY_RUN) {
    const cus = await stripe.customers.create({
      email,
      name,
      phone: phone || undefined,
    });
    return cus.id; // e.g. "cus_Abc123…"
  }
  return `cus_${nano9()}`;
}

/** Creates a real Stripe Connect custom account, or returns a placeholder */
async function getStripeConnectAccount(orgName, email) {
  if (stripe && !DRY_RUN) {
    const acct = await stripe.accounts.create({
      type: 'custom',
      country: 'US',
      email,
      business_profile: { name: orgName, mcc: '6300' },
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });
    return acct.id; // e.g. "acct_Abc123…"
  }
  return `acct_${nano9()}`;
}

// ═══════════════════════════════════════════════════════
//  FIREBASE INIT
// ═══════════════════════════════════════════════════════
if (!getApps().length) {
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`🔧  Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    initializeApp({
      projectId: process.env.GCLOUD_PROJECT || 'idemand-submissions-dev',
    });
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    initializeApp({
      credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    });
  } else {
    console.error(
      '❌  Set FIRESTORE_EMULATOR_HOST or GOOGLE_APPLICATION_CREDENTIALS',
    );
    process.exit(1);
  }
}
const db = getFirestore();

// ═══════════════════════════════════════════════════════
//  ID FACTORIES
// ═══════════════════════════════════════════════════════
const ALPHA = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const nano9 = customAlphabet(ALPHA, 9);
const nano7 = customAlphabet(ALPHA, 7);
const nano6 = customAlphabet(ALPHA, 6);

const mkPolicyId = () => `ID${customAlphabet(ALPHA, 8)()}`;
const mkLocationId = () => `loc_${nano9()}`;
const mkUserId = () => `usr_${nano9()}`;
const mkAgentId = () => `agt_${nano9()}`;
const mkRatingId = () => `rat_${nano9()}`;
const mkEvtId = () => `evt_${nano9()}`;
const mkRecId = () => `rec_${nano7()}`;
const mkFinTrxId = () => `fin_${nano9()}`;
const mkTaxId = () => `tax_${nano6()}`;
const mkTaxCalcId = () => `taxcalc_${nano6()}`;
const mkLicenseId = () => `lic_${nano7()}`;
const mkClaimId = () => `clm_${nano7()}`;
const mkImportId = () => `imp_${nano7()}`;
const mkTrxId = (pol, loc, evt) => `${pol}-${loc}-${evt}`;

// ═══════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════
const ts = (d) => Timestamp.fromDate(d instanceof Date ? d : new Date(d));
const tsNow = () => Timestamp.now();
const meta = (created, version = 1) => ({
  metadata: {
    created: ts(created || new Date()),
    updated: ts(created || new Date()),
    version,
  },
});

const STATES = [
  'FL',
  'TX',
  'CA',
  'NY',
  'LA',
  'GA',
  'SC',
  'NC',
  'VA',
  'MD',
  'NJ',
  'MA',
  'CT',
  'AL',
  'MS',
  'TN',
  'OH',
  'IL',
  'PA',
  'CO',
];
const COASTAL = [
  'FL',
  'TX',
  'CA',
  'NY',
  'LA',
  'GA',
  'SC',
  'NC',
  'VA',
  'MD',
  'NJ',
  'MA',
  'CT',
];
const FLOOD_ZONES = ['A', 'AE', 'X', 'V', 'VE', 'B', 'C', 'AO', 'AH'];
const BASEMENTS = ['no', 'finished', 'unfinished', 'unknown'];
const PRIOR_LOSS = ['0', '1', '2'];
const CANCEL_REASONS = [
  'sold',
  'premium_pmt_failure',
  'exposure_change',
  'insured_choice',
];
const LICENSE_STATES = ['FL', 'TX', 'CA', 'NY', 'LA', 'GA', 'SC', 'NC', 'VA'];
const DISC_STATES = ['FL', 'TX', 'CA', 'NY', 'LA', 'NC', 'SC'];
const CARRIERS = ['Acme Carrier, LLC', 'Huxley Specialty, Inc.'];
const TRX_TYPES_ALL = [
  'new',
  'endorsement',
  'amendment',
  'cancellation',
  'flat_cancel',
  'reinstatement',
  'renewal',
];

function randomState(coastal = false) {
  return faker.helpers.arrayElement(coastal ? COASTAL : STATES);
}

function fakeAddress(state) {
  return {
    addressLine1: faker.location.streetAddress(),
    addressLine2:
      faker.helpers.maybe(() => faker.location.secondaryAddress(), {
        probability: 0.2,
      }) || '',
    city: faker.location.city(),
    state: state || randomState(),
    postal: faker.location.zipCode('#####'),
    countyFIPS: faker.string.numeric(5),
    countyName: `${faker.location.city()} County`,
  };
}

function compressAddress(addr) {
  return {
    s1: addr.addressLine1,
    s2: addr.addressLine2 || '',
    c: addr.city,
    st: addr.state,
    p: addr.postal,
  };
}

function fakeCoords(state) {
  const B = {
    FL: { lat: [24.5, 30.9], lng: [-87.6, -80.0] },
    TX: { lat: [25.8, 36.5], lng: [-106.6, -93.5] },
    CA: { lat: [32.5, 42.0], lng: [-124.4, -114.1] },
    NY: { lat: [40.4, 45.0], lng: [-79.8, -71.8] },
    LA: { lat: [28.9, 33.0], lng: [-94.0, -88.8] },
    GA: { lat: [30.3, 35.0], lng: [-85.6, -80.8] },
    NC: { lat: [33.8, 36.6], lng: [-84.3, -75.5] },
    SC: { lat: [32.0, 35.2], lng: [-83.3, -78.5] },
  };
  const b = B[state] || { lat: [25.0, 47.0], lng: [-124.0, -66.0] };
  return {
    latitude: faker.number.float({
      min: b.lat[0],
      max: b.lat[1],
      fractionDigits: 6,
    }),
    longitude: faker.number.float({
      min: b.lng[0],
      max: b.lng[1],
      fractionDigits: 6,
    }),
  };
}

function fakeLimits() {
  const a = faker.helpers.arrayElement([
    250000, 300000, 500000, 750000, 1000000,
  ]);
  const b = faker.helpers.arrayElement([0, 50000, 100000]);
  const c = faker.helpers.arrayElement([0, 50000, 100000, 150000]);
  const d = faker.helpers.arrayElement([0, 25000, 50000]);
  return { limitA: a, limitB: b, limitC: c, limitD: d };
}

const tiv = (l) => l.limitA + l.limitB + l.limitC + l.limitD;

function fakeRCVs(limits) {
  const building = Math.max(Math.round(limits.limitA * 1.1), 150000);
  return {
    building,
    otherStructures: limits.limitB,
    contents: limits.limitC,
    BI: limits.limitD,
    total: building + limits.limitB + limits.limitC + limits.limitD,
  };
}

function fakeDeductible() {
  return faker.helpers.arrayElement([1000, 2500, 5000, 10000, 25000]);
}

const r2 = (n) => Math.round(n * 100) / 100;

function fakePremCalc(limits, commPct = 0.15) {
  const inlandAAL = faker.number.float({
    min: 200,
    max: 8000,
    fractionDigits: 2,
  });
  const surgeAAL = faker.number.float({
    min: 50,
    max: 3000,
    fractionDigits: 2,
  });
  const tsunamiAAL = faker.number.float({ min: 0, max: 10, fractionDigits: 2 });
  const DE = 1 / (1 - 0.3735);
  const inT = r2(inlandAAL * 1.1),
    suT = r2(surgeAAL * 1.15),
    tsT = r2(tsunamiAAL * 1.15);
  const inP = inT * 1.5 * DE,
    suP = suT * 2.5 * DE,
    tsP = tsT * 1.0 * DE;
  const sub = inP + suP + tsP;
  const minP = Math.max(300, Math.round(tiv(limits) * 0.0004));
  const prov = Math.ceil(Math.max(sub, minP));
  const adj = prov * (commPct - 0.15);
  const annual = Math.ceil(prov + adj);
  const mgaCommPct = 0.3;
  return {
    AALs: { inland: inlandAAL, surge: surgeAAL, tsunami: tsunamiAAL },
    premiumCalcData: {
      techPremium: {
        inland: inT,
        surge: suT,
        tsunami: tsT,
        total: inT + suT + tsT,
      },
      floodCategoryPremium: { inland: inP, surge: suP, tsunami: tsP },
      premiumSubtotal: sub,
      provisionalPremium: prov,
      subproducerAdj: adj,
      subproducerCommissionPct: commPct,
      minPremium: minP,
      minPremiumAdj: Math.max(0, minP - sub),
      annualPremium: annual,
      MGACommission: r2(annual * mgaCommPct),
      MGACommissionPct: mgaCommPct,
    },
  };
}

function calcTerm(annual, eff, exp) {
  const days = differenceInCalendarDays(exp, eff);
  const prem = r2((days / 365) * annual);
  return { termDays: days, termPremium: prem, dailyPremium: r2(prem / days) };
}

function fakeTaxItems(premium, state) {
  const rate = faker.number.float({ min: 0.01, max: 0.06, fractionDigits: 4 });
  const rRate = faker.number.float({
    min: 0.001,
    max: 0.005,
    fractionDigits: 4,
  });
  const base = {
    state,
    baseDigits: 2,
    resultDigits: 2,
    resultRoundType: 'nearest',
    refundable: true,
    transactionTypes: TRX_TYPES_ALL,
    expirationDate: ts(new Date('2050-01-01')),
    calcDate: tsNow(),
    subjectBaseAmount: premium,
    subjectBase: ['premium'],
  };
  return [
    {
      ...base,
      displayName: 'Premium Tax',
      rate,
      value: r2(premium * rate),
      taxId: mkTaxId(),
      taxCalcId: mkTaxCalcId(),
    },
    {
      ...base,
      displayName: 'Regulatory Fee',
      rate: rRate,
      value: r2(premium * rRate),
      taxId: mkTaxId(),
      taxCalcId: mkTaxCalcId(),
    },
  ];
}

function fakeFeeItems() {
  return [
    {
      displayName: 'MGA Fee',
      value: faker.helpers.arrayElement([150, 200, 250, 300]),
      refundable: true,
    },
    {
      displayName: 'Inspection Fee',
      value: faker.helpers.arrayElement([50, 75, 100]),
      refundable: false,
    },
  ];
}

function fakeRatingPropData() {
  return {
    CBRSDesignation: faker.helpers.arrayElement(['IN', 'OUT', null]),
    basement: faker.helpers.arrayElement(BASEMENTS),
    distToCoastFeet: faker.number.int({ min: 500, max: 50000 }),
    floodZone: faker.helpers.arrayElement(FLOOD_ZONES),
    numStories: faker.helpers.arrayElement([1, 1, 2, 2, 3]),
    propertyCode: faker.helpers.arrayElement(['SFR', 'CONDO', 'MFR', null]),
    replacementCost: faker.number.int({ min: 150000, max: 800000 }),
    sqFootage: faker.number.int({ min: 800, max: 5000 }),
    yearBuilt: faker.number.int({ min: 1960, max: 2020 }),
    FFH: faker.helpers.arrayElement([0, 1, 2, 3, null]),
    priorLossCount: faker.helpers.arrayElement(PRIOR_LOSS),
    units: faker.helpers.arrayElement([1, null]),
    elevation: faker.number.float({ min: -2, max: 20, fractionDigits: 1 }),
  };
}

function fakeAgentDoc(agent) {
  return {
    name: `${agent.firstName} ${agent.lastName}`,
    email: agent.email,
    phone: agent.phone,
    userId: agent.aid,
  };
}

function fakeAgencyDoc(org) {
  return {
    name: org.orgName,
    orgId: org.oid,
    stripeAccountId: org.stripeAcct,
    address: org.address,
  };
}

function fakeBillingEntity(user) {
  return {
    displayName: user.displayName,
    email: user.email,
    phone: user.phone || '2395550100',
    billingType: faker.helpers.arrayElement(['invoice', 'checkout']),
    selectedPaymentMethodId: null,
    paymentMethods: [],
  };
}

function fakeSLLicense(state) {
  return {
    name: faker.person.fullName(),
    licenseNum: `SL${faker.string.numeric(8)}`,
    licenseState: state,
    phone: faker.phone.number('##########'),
  };
}

function fakeCarrier() {
  return {
    name: faker.helpers.arrayElement(CARRIERS),
    orgId: 'carrier_rockingham',
    stripeAccountId: `acct_rock_${nano7()}`,
    address: {
      addressLine1: '633 East Main St.',
      addressLine2: '',
      city: 'Harrisonburg',
      state: 'VA',
      postal: '22801',
    },
  };
}

// ═══════════════════════════════════════════════════════
//  BATCH WRITER
// ═══════════════════════════════════════════════════════
class BatchWriter {
  constructor() {
    this._b = db.batch();
    this._n = 0;
    this.total = 0;
  }
  set(ref, data) {
    if (DRY_RUN) {
      this.total++;
      return;
    }
    this._b.set(ref, data);
    this._n++;
    this.total++;
    if (this._n >= 450) this._flush();
  }
  async _flush() {
    if (!DRY_RUN && this._n > 0) {
      await this._b.commit();
      this._b = db.batch();
      this._n = 0;
    }
  }
  async commit() {
    await this._flush();
  }
}

// ═══════════════════════════════════════════════════════
//  RESET
// ═══════════════════════════════════════════════════════
const RESET_COLS = [
  'organizations',
  'users',
  'submissions',
  'quotes',
  'policies',
  'locations',
  'ratingData',
  'transactions',
  'receivables',
  'financialTransactions',
  'agencySubmissions',
  'emailActivity',
  'dataImports',
  'taxes',
  'licenses',
  'disclosures',
  'moratoriums',
];
async function delCol(path, size = 200) {
  const snap = await db.collection(path).limit(size).get();
  if (snap.empty) return;
  const b = db.batch();
  snap.docs.forEach((d) => b.delete(d.ref));
  await b.commit();
  return delCol(path, size);
}
async function resetCollections() {
  console.log('🗑️   Resetting…');
  for (const c of RESET_COLS) {
    await delCol(c);
    process.stdout.write(`   cleared ${c}\n`);
  }
}

// ═══════════════════════════════════════════════════════
//  CONFIG SEEDERS  (taxes, licenses, disclosures, moratoriums)
// ═══════════════════════════════════════════════════════
function seedTaxConfig(bw, state) {
  const eff = sub(new Date(), { years: 2 });
  const base = {
    state,
    effectiveDate: ts(eff),
    expirationDate: ts(new Date('2050-01-01')),
    LOB: ['residential'],
    products: ['flood'],
    transactionTypes: TRX_TYPES_ALL,
    refundable: true,
    rateType: 'percent',
    subjectBase: ['premium'],
    baseDigits: 2,
    resultDigits: 2,
    resultRoundType: 'nearest',
    baseRoundType: 'nearest',
    ...meta(eff),
  };
  bw.set(db.collection('taxes').doc(mkTaxId()), {
    ...base,
    displayName: 'Premium Tax',
    rate: faker.number.float({ min: 0.01, max: 0.06, fractionDigits: 4 }),
  });
  bw.set(db.collection('taxes').doc(mkTaxId()), {
    ...base,
    displayName: 'Regulatory Fee',
    rate: faker.number.float({ min: 0.001, max: 0.005, fractionDigits: 4 }),
  });
}

function seedLicense(bw, state) {
  const eff = sub(new Date(), { months: 18 });
  bw.set(db.collection('licenses').doc(mkLicenseId()), {
    state,
    ownerType: 'individual',
    licensee: faker.person.fullName(),
    licenseType: 'surplus lines',
    surplusLinesProducerOfRecord: true,
    licenseNumber: `SL${faker.string.numeric(8)}`,
    effectiveDate: ts(eff),
    expirationDate: ts(add(eff, { years: 2 })),
    SLAssociationMembershipRequired: false,
    address: fakeAddress(state),
    phone: faker.phone.number('##########'),
    ...meta(eff),
  });
}

function seedDisclosure(bw, state) {
  const created = sub(new Date(), { months: 6 });
  bw.set(db.collection('disclosures').doc(`disc_${nano7()}`), {
    products: ['flood'],
    state,
    displayName: `${state} State Disclosure`,
    type: 'state disclosure',
    content: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: `This policy is subject to the surplus lines laws of the State of ${state}. The insurer does not participate in any state guaranty fund. ${faker.lorem.sentences(2)}`,
            },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: faker.lorem.sentences(2) }],
        },
      ],
    },
    ...meta(created),
  });
}

function seedMoratorium(bw, state) {
  const eff = sub(new Date(), { days: faker.number.int({ min: 1, max: 30 }) });
  bw.set(db.collection('moratoriums').doc(`mor_${nano7()}`), {
    locationDetails: [
      {
        state,
        stateFP: faker.string.numeric(2),
        countyName: `${faker.location.city()} County`,
        countyFP: faker.string.numeric(3),
      },
    ],
    locations: [faker.string.numeric(5)],
    product: { flood: true, wind: false },
    effectiveDate: ts(eff),
    expirationDate: ts(
      add(eff, { days: faker.number.int({ min: 7, max: 60 }) }),
    ),
    reason: faker.helpers.arrayElement([
      'Hurricane Warning',
      'Tropical Storm Warning',
      'Active Storm Threat',
    ]),
    ...meta(eff),
  });
}

// ═══════════════════════════════════════════════════════
//  ENTITY SEEDERS
// ═══════════════════════════════════════════════════════
function seedIdemandOrg(bw) {
  const created = sub(new Date(), { months: 24 });
  bw.set(db.collection('organizations').doc('idemand'), {
    type: 'agency',
    orgId: 'idemand',
    orgName: 'iDemand Insurance Agency, Inc.',
    tenantId: null,
    stripeAccountId: `acct_idemand_${nano7()}`,
    status: 'active',
    address: {
      addressLine1: '6017 Pine Ridge Rd., Suite 401',
      addressLine2: '',
      city: 'Naples',
      state: 'FL',
      postal: '34119',
      countyFIPS: '12021',
      countyName: 'Collier County',
    },
    emailDomains: ['idemandinsurance.com'],
    enforceDomainRestriction: false,
    authProviders: ['password'],
    defaultCommission: { flood: 0.15, wind: 0.15 },
    photoURL: null,
    ...meta(created),
  });
}

function seedIdemandAdmin(bw) {
  const id = `admin_${nano9()}`;
  const created = sub(new Date(), { months: 24 });
  bw.set(db.collection('users').doc(id), {
    displayName: 'iDemand Admin',
    firstName: 'iDemand',
    lastName: 'Admin',
    email: 'admin@idemandinsurance.com',
    phone: '2395550100',
    orgId: 'idemand',
    tenantId: null,
    ...meta(created),
  });
  bw.set(
    db
      .collection('organizations')
      .doc('idemand')
      .collection('userClaims')
      .doc(id),
    { iDemandAdmin: true, iDemandUser: true, _lastCommitted: tsNow() },
  );
}

async function seedAgency(bw, index) {
  const state = randomState(true);
  const oid = `org_${nano9()}`;
  const tenantId = `tenant_${nano9()}`;
  const email = faker.internet.email().toLowerCase();
  const orgName = `${faker.company.name()} Flood Insurance`;
  const address = fakeAddress(state);
  const created = sub(new Date(), {
    months: faker.number.int({ min: 3, max: 18 }),
  });
  const stripeAcct = await getStripeConnectAccount(orgName, email);

  bw.set(db.collection('organizations').doc(oid), {
    type: 'agency',
    orgId: oid,
    orgName,
    tenantId,
    stripeAccountId: stripeAcct,
    status: 'active',
    address,
    FEIN: faker.string.numeric(9),
    EandOURL: faker.internet.url(),
    emailDomains: [faker.internet.domainName()],
    enforceDomainRestriction: false,
    authProviders: ['password'],
    defaultCommission: { flood: 0.15, wind: 0.15 },
    photoURL: null,
    website: faker.internet.url(),
    primaryContact: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      displayName: faker.person.fullName(),
      email,
      phone: faker.phone.number('##########'),
    },
    ...meta(created),
  });
  return { oid, tenantId, stripeAcct, state, orgName, address, created, email };
}

function seedOrgAdmin(bw, { oid, tenantId, created }) {
  const id = mkUserId();
  const firstName = faker.person.firstName(),
    lastName = faker.person.lastName();
  const email = faker.internet.email().toLowerCase();
  bw.set(db.collection('users').doc(id), {
    displayName: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email,
    phone: faker.phone.number('##########'),
    orgId: oid,
    tenantId,
    ...meta(created),
  });
  bw.set(
    db.collection('organizations').doc(oid).collection('userClaims').doc(id),
    { orgAdmin: true, agent: false, _lastCommitted: tsNow() },
  );
}

function seedAgent(
  bw,
  { oid, tenantId, stripeAcct, state, orgName, address, created },
) {
  const aid = mkAgentId();
  const firstName = faker.person.firstName(),
    lastName = faker.person.lastName();
  const email = faker.internet.email().toLowerCase();
  const phone = faker.phone.number('##########');
  bw.set(db.collection('users').doc(aid), {
    displayName: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email,
    phone,
    orgId: oid,
    tenantId,
    defaultCommission: { flood: 0.15, wind: 0.15 },
    ...meta(created),
  });
  bw.set(
    db.collection('organizations').doc(oid).collection('userClaims').doc(aid),
    { agent: true, orgAdmin: false, _lastCommitted: tsNow() },
  );
  bw.set(
    db
      .collection('organizations')
      .doc(oid)
      .collection('invitations')
      .doc(email),
    {
      email,
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`,
      orgId: oid,
      orgName,
      customClaims: { agent: true },
      status: 'accepted',
      sent: true,
      id: email,
      invitedBy: { email: 'admin@idemandinsurance.com' },
      ...meta(created),
    },
  );
  return {
    aid,
    email,
    firstName,
    lastName,
    phone,
    oid,
    tenantId,
    stripeAcct,
    state,
    orgName,
    address,
  };
}

async function seedInsuredUser(bw) {
  const id = mkUserId();
  const firstName = faker.person.firstName(),
    lastName = faker.person.lastName();
  const email = faker.internet.email().toLowerCase();
  const phone = faker.phone.number('##########');
  const created = sub(new Date(), {
    days: faker.number.int({ min: 5, max: 90 }),
  });
  const stripeCustomerId = await getStripeCustomer(
    email,
    `${firstName} ${lastName}`,
    phone,
  );
  bw.set(db.collection('users').doc(id), {
    displayName: `${firstName} ${lastName}`,
    firstName,
    lastName,
    email,
    phone,
    stripe_customer_id: stripeCustomerId,
    orgId: null,
    tenantId: null,
    ...meta(created),
  });
  return {
    id,
    firstName,
    lastName,
    email,
    phone,
    displayName: `${firstName} ${lastName}`,
    stripeCustomerId,
  };
}

// ─── Rating Doc ──────────────────────────────────────
function seedRatingDoc(
  bw,
  {
    limits,
    rcvs,
    deductible,
    coords,
    ratingPropData,
    AALs,
    premiumCalcData,
    locationDocId,
  },
) {
  const rid = mkRatingId();
  bw.set(db.collection('ratingData').doc(rid), {
    submissionId: null,
    locationId: locationDocId,
    limits,
    TIV: tiv(limits),
    deductible,
    RCVs: rcvs,
    ratingPropertyData: ratingPropData,
    AALs,
    premiumCalcData,
    coordinates: new GeoPoint(coords.latitude, coords.longitude),
    PM: {
      inland: r2((AALs.inland * 1000) / tiv(limits)),
      surge: r2((AALs.surge * 1000) / tiv(limits)),
      tsunami: r2((AALs.tsunami * 1000) / tiv(limits)),
    },
    riskScore: {
      inland: faker.number.int({ min: 0, max: 99 }),
      surge: faker.number.int({ min: 0, max: 99 }),
      tsunami: faker.number.int({ min: 0, max: 50 }),
    },
    stateMultipliers: { inland: 1.5, surge: 2.5, tsunami: 1.0 },
    ...meta(new Date()),
  });
  return rid;
}

// ─── Location Doc ────────────────────────────────────
function seedLocation(
  bw,
  {
    locationDocId,
    policyDocId,
    limits,
    rcvs,
    deductible,
    coords,
    ratingPropData,
    ratingDocId,
    effDate,
    expDate,
    termPremium,
    termDays,
    annualPremium,
    state,
  },
) {
  bw.set(db.collection('locations').doc(locationDocId), {
    parentType: 'policy',
    address: fakeAddress(state),
    coordinates: new GeoPoint(coords.latitude, coords.longitude),
    geoHash: `u${faker.string.alphanumeric(8)}`,
    annualPremium,
    termPremium,
    termDays,
    limits,
    TIV: tiv(limits),
    RCVs: rcvs,
    deductible,
    additionalInsureds: [],
    mortgageeInterest: [],
    ratingDocId,
    ratingPropertyData: ratingPropData,
    effectiveDate: ts(effDate),
    expirationDate: ts(expDate),
    cancelEffDate: null,
    cancelReason: null,
    imageURLs: null,
    imagePaths: null,
    locationId: locationDocId,
    policyId: policyDocId,
    externalId: `EXT-${faker.string.alphanumeric(8).toUpperCase()}`,
    ...meta(effDate),
  });
}

// ─── Policy Doc ──────────────────────────────────────
function seedPolicy(
  bw,
  {
    policyDocId,
    locationDocId,
    agent,
    orgData,
    insuredUser,
    limits,
    termPremium,
    annualPremium,
    state,
    effDate,
    expDate,
    termDays,
    fees,
    taxes,
    ratingDocId,
  },
) {
  const namedInsured = {
    displayName: insuredUser.displayName,
    firstName: insuredUser.firstName,
    lastName: insuredUser.lastName,
    email: insuredUser.email,
    phone: insuredUser.phone,
    userId: insuredUser.id,
    orgId: null,
  };
  const taxTotal = taxes.reduce((s, t) => s + t.value, 0);
  const feeTotal = fees.reduce((s, f) => s + f.value, 0);
  const price = r2(termPremium + taxTotal + feeTotal);
  const billingId = insuredUser.id;
  const policyLoc = {
    termPremium,
    annualPremium,
    address: compressAddress(fakeAddress(state)),
    coords: new GeoPoint(coords_dummy().lat, coords_dummy().lng),
    billingEntityId: billingId,
  };
  bw.set(db.collection('policies').doc(policyDocId), {
    product: 'flood',
    paymentStatus: 'paid',
    term: 1,
    namedInsured,
    mailingAddress: { ...fakeAddress(state), name: insuredUser.displayName },
    locations: { [locationDocId]: policyLoc },
    homeState: state,
    termPremium,
    termPremiumWithCancels: termPremium,
    inStatePremium: termPremium,
    outStatePremium: 0,
    termDays,
    totalsByBillingEntity: { [billingId]: { termPremium, taxes, fees, price } },
    fees,
    taxes,
    price,
    effectiveDate: ts(effDate),
    expirationDate: ts(expDate),
    cancelEffDate: null,
    cancelReason: null,
    userId: insuredUser.id,
    agent: fakeAgentDoc(agent),
    agency: fakeAgencyDoc(orgData),
    billingEntities: { [billingId]: fakeBillingEntity(insuredUser) },
    defaultBillingEntityId: billingId,
    surplusLinesProducerOfRecord: fakeSLLicense(state),
    issuingCarrier:
      state === 'CA' || state === 'NY'
        ? 'Rockingham Insurance Company'
        : 'Rockingham Specialty, Inc.',
    carrier: fakeCarrier(),
    commSource: 'default',
    quoteId: null,
    externalId: null,
    documents: [],
    ...meta(effDate),
  });
  return policyLoc;
}
function coords_dummy() {
  return {
    lat: faker.number.float({ min: 25, max: 45, fractionDigits: 6 }),
    lng: faker.number.float({ min: -125, max: -66, fractionDigits: 6 }),
  };
}

// ─── Premium Transaction ─────────────────────────────
function seedPremTrx(
  bw,
  {
    policyDocId,
    locationDocId,
    agent,
    orgData,
    insuredUser,
    state,
    effDate,
    expDate,
    limits,
    rcvs,
    deductible,
    ratingPropData,
    termPremium,
    dailyPremium,
    termDays,
    annualPremium,
    premCalcData,
    fees,
    taxes,
  },
) {
  const evtId = mkEvtId();
  const tid = mkTrxId(policyDocId, locationDocId, evtId);
  const mgaC = premCalcData.MGACommission;
  const billingId = insuredUser.id;
  const taxTotal = taxes.reduce((s, t) => s + t.value, 0);
  const feeTotal = fees.reduce((s, f) => s + f.value, 0);
  bw.set(db.collection('transactions').doc(tid), {
    trxType: 'new',
    trxInterfaceType: 'premium',
    product: 'flood',
    policyId: policyDocId,
    locationId: locationDocId,
    externalId: null,
    term: 1,
    bookingDate: ts(effDate),
    issuingCarrier:
      state === 'CA' || state === 'NY'
        ? 'Rockingham Insurance Company'
        : 'Rockingham Specialty, Inc.',
    namedInsured: insuredUser.displayName,
    mailingAddress: { ...fakeAddress(state), name: insuredUser.displayName },
    agent: fakeAgentDoc(agent),
    agency: fakeAgencyDoc(orgData),
    homeState: state,
    policyEffDate: ts(effDate),
    policyExpDate: ts(expDate),
    trxEffDate: ts(effDate),
    trxExpDate: ts(expDate),
    trxDays: termDays,
    insuredLocation: {
      parentType: 'policy',
      address: fakeAddress(state),
      locationId: locationDocId,
      policyId: policyDocId,
      coordinates: new GeoPoint(coords_dummy().lat, coords_dummy().lng),
      geoHash: `u${faker.string.alphanumeric(8)}`,
      annualPremium,
      termPremium,
      termDays,
      limits,
      TIV: tiv(limits),
      RCVs: rcvs,
      deductible,
      additionalInsureds: [],
      mortgageeInterest: [],
      ratingDocId: mkRatingId(),
      ratingPropertyData: ratingPropData,
      effectiveDate: ts(effDate),
      expirationDate: ts(expDate),
      cancelEffDate: null,
      cancelReason: null,
      externalId: null,
    },
    ratingPropertyData: {
      ...ratingPropData,
      units: 1,
      tier1: false,
      construction: 'frame',
    },
    deductible,
    limits,
    TIV: tiv(limits),
    RCVs: rcvs,
    premiumCalcData: premCalcData,
    locationAnnualPremium: annualPremium,
    termPremium,
    MGACommission: mgaC,
    MGACommissionPct: premCalcData.MGACommissionPct,
    netDWP: r2(termPremium - mgaC),
    dailyPremium,
    termProratedPct: r2(termDays / 365),
    netErrorAdj: 0,
    surplusLinesTax:
      taxes.find((t) => t.displayName === 'Premium Tax')?.value || 0,
    surplusLinesRegulatoryFee:
      taxes.find((t) => t.displayName === 'Regulatory Fee')?.value || 0,
    MGAFee: fees.find((f) => f.displayName === 'MGA Fee')?.value || 0,
    inspectionFee:
      fees.find((f) => f.displayName === 'Inspection Fee')?.value || 0,
    otherInterestedParties: [],
    additionalNamedInsured: [],
    billingEntityId: billingId,
    billingEntity: fakeBillingEntity(insuredUser),
    billingEntityTotals: {
      termPremium,
      taxes,
      fees,
      price: r2(termPremium + taxTotal + feeTotal),
    },
    eventId: evtId,
    ...meta(effDate),
  });
  return tid;
}

// ─── Cancellation Offset ─────────────────────────────
function seedCancelTrx(
  bw,
  {
    policyDocId,
    locationDocId,
    agent,
    orgData,
    insuredUser,
    state,
    effDate,
    expDate,
    termPremium,
    dailyPremium,
    taxes,
    fees,
  },
) {
  const cancelDate = add(effDate, {
    months: faker.number.int({ min: 2, max: 8 }),
  });
  const daysEarned = differenceInCalendarDays(cancelDate, effDate);
  const earnedPrem = r2(daysEarned * dailyPremium);
  const offsetPrem = -r2(termPremium - earnedPrem);
  const evtId = mkEvtId();
  const tid = mkTrxId(policyDocId, locationDocId, evtId) + '-cancel';
  bw.set(db.collection('transactions').doc(tid), {
    trxType: 'cancellation',
    trxInterfaceType: 'offset',
    product: 'flood',
    policyId: policyDocId,
    locationId: locationDocId,
    externalId: null,
    term: 1,
    bookingDate: ts(cancelDate),
    issuingCarrier: 'Rockingham Specialty, Inc.',
    namedInsured: insuredUser.displayName,
    mailingAddress: { ...fakeAddress(state), name: insuredUser.displayName },
    agent: fakeAgentDoc(agent),
    agency: fakeAgencyDoc(orgData),
    homeState: state,
    policyEffDate: ts(effDate),
    policyExpDate: ts(expDate),
    trxEffDate: ts(cancelDate),
    trxExpDate: ts(add(cancelDate, { days: 1 })),
    trxDays: 1,
    insuredLocation: null,
    termPremium: offsetPrem,
    MGACommission: r2(offsetPrem * 0.3),
    MGACommissionPct: 0.3,
    netDWP: r2(offsetPrem - r2(offsetPrem * 0.3)),
    dailyPremium: offsetPrem,
    surplusLinesTax: r2(
      (taxes.find((t) => t.displayName === 'Premium Tax')?.value || 0) * -1,
    ),
    surplusLinesRegulatoryFee: 0,
    MGAFee: 0,
    inspectionFee: 0,
    cancelReason: faker.helpers.arrayElement(CANCEL_REASONS),
    previousPremiumTrxId: mkTrxId(policyDocId, locationDocId, mkEvtId()),
    eventId: evtId,
    ...meta(cancelDate),
  });
}

// ─── Endorsement Pair ────────────────────────────────
function seedEndorsementTrx(
  bw,
  {
    policyDocId,
    locationDocId,
    agent,
    orgData,
    insuredUser,
    state,
    effDate,
    expDate,
    limits,
    termPremium,
    dailyPremium,
    annualPremium,
    premCalcData,
    fees,
    taxes,
  },
) {
  const endorseDate = add(effDate, {
    months: faker.number.int({ min: 2, max: 6 }),
  });
  const evtId = mkEvtId();
  const prevTrxId = mkTrxId(policyDocId, locationDocId, mkEvtId());
  // offset
  const daysEarned = differenceInCalendarDays(endorseDate, effDate);
  const earnedPrem = r2(daysEarned * dailyPremium);
  const offsetPrem = -r2(termPremium - earnedPrem);
  bw.set(
    db
      .collection('transactions')
      .doc(mkTrxId(policyDocId, locationDocId, evtId) + '-offset'),
    {
      trxType: 'endorsement',
      trxInterfaceType: 'offset',
      product: 'flood',
      policyId: policyDocId,
      locationId: locationDocId,
      externalId: null,
      term: 1,
      bookingDate: ts(endorseDate),
      issuingCarrier: 'Rockingham Specialty, Inc.',
      namedInsured: insuredUser.displayName,
      mailingAddress: { ...fakeAddress(state), name: insuredUser.displayName },
      agent: fakeAgentDoc(agent),
      agency: fakeAgencyDoc(orgData),
      homeState: state,
      policyEffDate: ts(effDate),
      policyExpDate: ts(expDate),
      trxEffDate: ts(endorseDate),
      trxExpDate: ts(add(endorseDate, { days: 1 })),
      trxDays: 1,
      insuredLocation: null,
      termPremium: offsetPrem,
      MGACommission: r2(offsetPrem * 0.3),
      MGACommissionPct: 0.3,
      netDWP: r2(offsetPrem - r2(offsetPrem * 0.3)),
      dailyPremium: offsetPrem,
      surplusLinesTax: 0,
      surplusLinesRegulatoryFee: 0,
      MGAFee: 0,
      inspectionFee: 0,
      cancelReason: null,
      previousPremiumTrxId: prevTrxId,
      eventId: evtId,
      ...meta(endorseDate),
    },
  );
  // new premium
  const newLimits = { ...limits, limitA: limits.limitA + 50000 };
  const { premiumCalcData: newPCD } = fakePremCalc(newLimits);
  const {
    termPremium: newTP,
    termDays: newTD,
    dailyPremium: newDP,
  } = calcTerm(newPCD.annualPremium, endorseDate, expDate);
  bw.set(
    db
      .collection('transactions')
      .doc(mkTrxId(policyDocId, locationDocId, evtId)),
    {
      trxType: 'endorsement',
      trxInterfaceType: 'premium',
      product: 'flood',
      policyId: policyDocId,
      locationId: locationDocId,
      externalId: null,
      term: 1,
      bookingDate: ts(endorseDate),
      issuingCarrier: 'Rockingham Specialty, Inc.',
      namedInsured: insuredUser.displayName,
      mailingAddress: { ...fakeAddress(state), name: insuredUser.displayName },
      agent: fakeAgentDoc(agent),
      agency: fakeAgencyDoc(orgData),
      homeState: state,
      policyEffDate: ts(effDate),
      policyExpDate: ts(expDate),
      trxEffDate: ts(endorseDate),
      trxExpDate: ts(expDate),
      trxDays: newTD,
      insuredLocation: null,
      ratingPropertyData: null,
      deductible: fakeDeductible(),
      limits: newLimits,
      TIV: tiv(newLimits),
      RCVs: fakeRCVs(newLimits),
      premiumCalcData: newPCD,
      locationAnnualPremium: newPCD.annualPremium,
      termPremium: newTP,
      MGACommission: newPCD.MGACommission,
      MGACommissionPct: newPCD.MGACommissionPct,
      netDWP: r2(newTP - newPCD.MGACommission),
      dailyPremium: newDP,
      termProratedPct: r2(newTD / 365),
      netErrorAdj: 0,
      surplusLinesTax:
        taxes.find((t) => t.displayName === 'Premium Tax')?.value || 0,
      surplusLinesRegulatoryFee: 0,
      MGAFee: 0,
      inspectionFee: 0,
      otherInterestedParties: [],
      additionalNamedInsured: [],
      billingEntityId: insuredUser.id,
      billingEntity: fakeBillingEntity(insuredUser),
      billingEntityTotals: { termPremium: newTP, taxes, fees, price: newTP },
      eventId: evtId,
      ...meta(endorseDate),
    },
  );
}

// ─── Receivable ──────────────────────────────────────
function seedReceivable(
  bw,
  {
    policyDocId,
    locationDocId,
    insuredUser,
    termPremium,
    taxes,
    fees,
    effDate,
    stripeCustomerId,
    policyLoc,
  },
) {
  const rid = mkRecId();
  const taxTotal = taxes.reduce((s, t) => s + t.value, 0);
  const feeTotal = fees.reduce((s, f) => s + f.value, 0);
  const total = r2(termPremium + taxTotal + feeTotal);
  const toAmt = (v) => Math.round(v * 100);
  const rTax = toAmt(
    taxes
      .filter((t) => t.refundable !== false)
      .reduce((s, t) => s + t.value, 0),
  );
  const rFee = toAmt(
    fees.filter((f) => f.refundable !== false).reduce((s, f) => s + f.value, 0),
  );
  const cusId = stripeCustomerId;

  bw.set(db.collection('receivables').doc(rid), {
    policyId: policyDocId,
    stripeCustomerId: cusId,
    billingEntityDetails: {
      name: insuredUser.displayName,
      email: insuredUser.email,
      phone: insuredUser.phone,
      address: null,
    },
    lineItems: [
      {
        displayName: 'iDemand Flood term premium',
        amount: toAmt(termPremium),
        descriptor: `Policy ${policyDocId}`,
      },
      ...fees.map((f) => ({
        displayName: f.displayName,
        amount: toAmt(f.value),
        descriptor: '',
      })),
      ...taxes.map((t) => ({
        displayName: t.displayName,
        amount: toAmt(t.value),
        descriptor: '',
      })),
    ],
    transfers: [
      {
        amount: toAmt(termPremium * 0.15),
        destination: `acct_${nano9()}`,
        percentOfTermPremium: 0.15,
      },
    ],
    taxes,
    fees,
    status: 'paid',
    paid: true,
    paidOutOfBand: false,
    invoiceId: `in_${nano9()}`,
    paymentIntentId: `pi_${nano9()}`,
    invoiceNumber: `INV-${faker.string.numeric(6)}`,
    hostedInvoiceUrl: faker.internet.url(),
    invoicePdfUrl: faker.internet.url(),
    refundableTaxesAmount: rTax,
    totalTaxesAmount: toAmt(taxTotal),
    refundableFeesAmount: rFee,
    totalFeesAmount: toAmt(feeTotal),
    totalRefundableAmount: toAmt(termPremium) + rTax + rFee,
    termPremiumAmount: toAmt(termPremium),
    totalAmount: toAmt(total),
    locations: { [locationDocId]: policyLoc },
    dueDate: ts(add(effDate, { days: 14 })),
    totalTransferred: toAmt(termPremium * 0.15),
    totalAmountPaid: toAmt(total),
    transfersByCharge: { [`ch_${nano9()}`]: toAmt(termPremium * 0.15) },
    ...meta(effDate),
  });
  return rid;
}

// ─── Financial Transaction ───────────────────────────
function seedFinTrx(
  bw,
  {
    policyDocId,
    insuredUser,
    agent,
    orgData,
    termPremium,
    taxes,
    fees,
    effDate,
  },
) {
  const total = r2(
    termPremium +
      taxes.reduce((s, t) => s + t.value, 0) +
      fees.reduce((s, f) => s + f.value, 0),
  );
  bw.set(db.collection('financialTransactions').doc(mkFinTrxId()), {
    transactionId: `TXN-${faker.string.numeric(10)}`,
    amount: Math.round(total * 100),
    amountCaptured: Math.round(total * 100),
    amountRefunded: 0,
    processingFees: r2(total * 0.029),
    billingDetails: {
      address: null,
      email: insuredUser.email,
      name: insuredUser.displayName,
      phone: insuredUser.phone,
    },
    invoiceId: `in_${nano9()}`,
    userId: insuredUser.id,
    policyId: policyDocId,
    paid: true,
    paymentMethodId: `pm_${nano9()}`,
    paymentMethodDetails: {
      id: `pm_${nano9()}`,
      emailAddress: insuredUser.email,
      payer: insuredUser.displayName,
      accountHolder: insuredUser.displayName,
      transactionType: 'ACH',
      type: 'bank_account',
      maskedAccountNumber: `****${faker.string.numeric(4)}`,
    },
    receiptEmail: insuredUser.email,
    receiptNumber: `RCPT-${faker.string.numeric(6)}`,
    receiptUrl: faker.internet.url(),
    refunded: false,
    publicDescriptor: 'iDemand Flood Insurance',
    publicDescriptorTitle: 'Policy Premium',
    status: 'succeeded',
    namedInsured: {
      displayName: insuredUser.displayName,
      firstName: insuredUser.firstName,
      lastName: insuredUser.lastName,
      email: insuredUser.email,
      phone: insuredUser.phone,
    },
    agent: fakeAgentDoc(agent),
    agency: fakeAgencyDoc(orgData),
    ...meta(effDate),
  });
}

// ─── Change Request ───────────────────────────────────
function seedChangeRequest(
  bw,
  { policyDocId, locationDocId, agent, orgData, insuredUser, effDate, limits },
) {
  const reqId = `cr_${nano9()}`;
  const reqEff = add(effDate, { months: faker.number.int({ min: 3, max: 9 }) });
  const newLimits = { ...limits, limitA: limits.limitA + 50000 };
  const { premiumCalcData: nPCD } = fakePremCalc(newLimits);
  const status = faker.helpers.arrayElement([
    'accepted',
    'denied',
    'under_review',
    'submitted',
  ]);
  const created = sub(reqEff, { days: faker.number.int({ min: 5, max: 20 }) });
  bw.set(
    db
      .collection('policies')
      .doc(policyDocId)
      .collection('changeRequests')
      .doc(reqId),
    {
      trxType: 'endorsement',
      scope: 'location',
      locationId: locationDocId,
      requestEffDate: ts(reqEff),
      policyId: policyDocId,
      userId: insuredUser.id,
      agent: { userId: agent.aid },
      agency: { orgId: orgData.oid },
      status,
      submittedBy: {
        userId: insuredUser.id,
        displayName: insuredUser.displayName,
        email: insuredUser.email,
      },
      formValues: {
        limits: newLimits,
        deductible: fakeDeductible(),
        additionalInterests: [],
        externalId: `EXT-${faker.string.alphanumeric(6).toUpperCase()}`,
        requestEffDate: reqEff,
      },
      endorsementChanges: {
        [locationDocId]: {
          limits: newLimits,
          annualPremium: nPCD.annualPremium,
          termPremium: r2(nPCD.annualPremium * 0.8),
          termDays: 290,
          ratingDocId: mkRatingId(),
          TIV: tiv(newLimits),
          RCVs: fakeRCVs(newLimits),
        },
      },
      amendmentChanges: {},
      locationChanges: { limits: newLimits, annualPremium: nPCD.annualPremium },
      policyChanges: { termPremium: r2(nPCD.annualPremium * 0.8) },
      policyChangesCalcVersion: 1,
      ...(status === 'accepted'
        ? {
            processedTimestamp: ts(add(created, { days: 3 })),
            processedByUserId: `admin_${nano9()}`,
            underwriterNotes: faker.lorem.sentence(),
          }
        : {}),
      _lastCommitted: tsNow(),
      ...meta(created),
    },
  );
}

// ─── Claim ────────────────────────────────────────────
function seedClaim(bw, { policyDocId, locationDocId, insuredUser }) {
  const claimId = mkClaimId();
  const created = sub(new Date(), {
    days: faker.number.int({ min: 5, max: 180 }),
  });
  bw.set(
    db
      .collection('policies')
      .doc(policyDocId)
      .collection('claims')
      .doc(claimId),
    {
      policyId: policyDocId,
      locationId: locationDocId,
      claimId,
      status: faker.helpers.arrayElement([
        'open',
        'under_review',
        'closed',
        'paid',
      ]),
      contact: {
        firstName: insuredUser.firstName,
        lastName: insuredUser.lastName,
        email: insuredUser.email,
        phone: insuredUser.phone,
        preferredMethod: faker.helpers.arrayElement(['email', 'phone']),
      },
      description: faker.lorem.sentences(2),
      damageType: faker.helpers.arrayElement([
        'flood',
        'wind',
        'fire',
        'other',
      ]),
      estimatedLoss: faker.number.int({ min: 1000, max: 200000 }),
      ...meta(created),
    },
  );
}

// ─── Submission ───────────────────────────────────────
function seedSubmission(bw, { agent, orgData, state }) {
  const created = sub(new Date(), {
    days: faker.number.int({ min: 5, max: 90 }),
  });
  bw.set(db.collection('submissions').doc(`sub_${nano9()}`), {
    product: 'flood',
    address: fakeAddress(state),
    coordinates: new GeoPoint(coords_dummy().lat, coords_dummy().lng),
    limits: fakeLimits(),
    deductible: fakeDeductible(),
    exclusionsExist: false,
    exclusions: [],
    priorLossCount: faker.helpers.arrayElement(PRIOR_LOSS),
    contact: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      userId: null,
    },
    userAcceptance: true,
    homeState: state,
    ratingPropertyData: fakeRatingPropData(),
    propertyDataDocId: null,
    rcvSourceUser: null,
    status: faker.helpers.arrayElement([
      'submitted',
      'quoted',
      'under_review',
      'ineligible',
    ]),
    agent: fakeAgentDoc(agent),
    agency: fakeAgencyDoc(orgData),
    commSource: 'default',
    ...meta(created),
  });
}

// ─── Quote ────────────────────────────────────────────
function seedQuote(bw, { agent, orgData, insuredUser, state }) {
  const created = sub(new Date(), {
    days: faker.number.int({ min: 1, max: 30 }),
  });
  const effDate = add(new Date(), {
    days: faker.number.int({ min: 1, max: 30 }),
  });
  const limits = fakeLimits();
  const rcvs = fakeRCVs(limits);
  const deductible = fakeDeductible();
  const rpd = fakeRatingPropData();
  const { AALs, premiumCalcData } = fakePremCalc(limits);
  const annual = premiumCalcData.annualPremium;
  const fees = fakeFeeItems();
  const taxes = fakeTaxItems(annual, state);
  const coords = fakeCoords(state);
  const rid = mkRatingId();
  bw.set(db.collection('ratingData').doc(rid), {
    submissionId: null,
    locationId: null,
    limits,
    TIV: tiv(limits),
    deductible,
    RCVs: rcvs,
    ratingPropertyData: rpd,
    AALs,
    premiumCalcData,
    coordinates: new GeoPoint(coords.latitude, coords.longitude),
    ...meta(created),
  });
  const quoteTotal = r2(
    annual +
      taxes.reduce((s, t) => s + t.value, 0) +
      fees.reduce((s, f) => s + f.value, 0),
  );
  bw.set(db.collection('quotes').doc(`QT${nano9()}`), {
    policyId: mkPolicyId(),
    product: 'flood',
    deductible,
    limits,
    address: fakeAddress(state),
    homeState: state,
    coordinates: new GeoPoint(coords.latitude, coords.longitude),
    fees,
    taxes,
    annualPremium: annual,
    subproducerCommission: premiumCalcData.subproducerCommissionPct,
    cardFee: r2(quoteTotal * 0.035),
    quoteTotal,
    effectiveDate: ts(effDate),
    quotePublishedDate: ts(created),
    quoteExpirationDate: ts(add(created, { days: 30 })),
    exclusions: [],
    additionalInterests: [],
    userId: insuredUser.id,
    namedInsured: {
      firstName: insuredUser.firstName,
      lastName: insuredUser.lastName,
      email: insuredUser.email,
      phone: insuredUser.phone,
      userId: insuredUser.id,
    },
    mailingAddress: { ...fakeAddress(state), name: insuredUser.displayName },
    agent: fakeAgentDoc(agent),
    agency: fakeAgencyDoc(orgData),
    carrier: fakeCarrier(),
    billingEntities: {},
    defaultBillingEntityId: 'namedInsured',
    status: faker.helpers.arrayElement(['awaiting:user', 'bound', 'expired']),
    ratingPropertyData: rpd,
    ratingDocId: rid,
    geoHash: null,
    commSource: 'default',
    ...meta(created),
  });
}

// ─── Agency Application ───────────────────────────────
function seedAgencyApp(bw) {
  const created = sub(new Date(), {
    days: faker.number.int({ min: 1, max: 60 }),
  });
  const state = randomState();
  bw.set(db.collection('agencySubmissions').doc(`agapp_${nano9()}`), {
    type: 'agency',
    orgName: `${faker.company.name()} Agency`,
    address: fakeAddress(state),
    coordinates: null,
    contact: {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email().toLowerCase(),
      phone: faker.phone.number('##########'),
    },
    agents: Array.from(
      { length: faker.number.int({ min: 1, max: 3 }) },
      () => ({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number('##########'),
      }),
    ),
    FEIN: faker.string.numeric(9),
    EandO: faker.internet.url(),
    status: faker.helpers.arrayElement(['submitted', 'active', 'pending_info']),
    sendAppReceivedNotification: true,
    ...meta(created),
  });
}

// ─── Email Activity ───────────────────────────────────
function seedEmailActivity(bw, { policyDocId, insuredUser }) {
  const created = sub(new Date(), {
    days: faker.number.int({ min: 1, max: 30 }),
  });
  const types = [
    'policy_delivery',
    'quote_expiring',
    'new_quote',
    'submission_received',
    'policy_change_request',
  ];
  const type = faker.helpers.arrayElement(types);
  bw.set(db.collection('emailActivity').doc(`em_${nano9()}`), {
    to: insuredUser.email,
    from: 'noreply@s-carlson.com',
    subject: faker.helpers.arrayElement([
      'Your new flood policy',
      'Quote expiring soon',
      'Here is your quote',
      'We received your submission',
    ]),
    status: faker.helpers.arrayElement(['delivered', 'sent', 'bounced']),
    emailType: type,
    policyId: policyDocId,
    firestoreTimestamp: ts(created),
    tags: {
      emailType: type,
      projectId: process.env.GCLOUD_PROJECT || 'demo-project',
    },
    ...meta(created),
  });
}

// ─── Import Summary + Staged Docs ────────────────────
function seedImport(bw, { state }) {
  const importId = mkImportId();
  const created = sub(new Date(), {
    days: faker.number.int({ min: 1, max: 60 }),
  });
  const importRef = db.collection('dataImports').doc(importId);
  const stagedRef = importRef.collection('stagedDocs');
  const count = faker.number.int({ min: 2, max: 5 });
  const ids = [];
  for (let i = 0; i < count; i++) {
    const docId = `staged_${nano9()}`;
    const limits = fakeLimits();
    const { premiumCalcData } = fakePremCalc(limits);
    const annual = premiumCalcData.annualPremium;
    bw.set(stagedRef.doc(docId), {
      product: 'flood',
      limits,
      deductible: fakeDeductible(),
      address: fakeAddress(state),
      homeState: state,
      annualPremium: annual,
      fees: fakeFeeItems(),
      taxes: fakeTaxItems(annual, state),
      importMeta: {
        status: faker.helpers.arrayElement(['new', 'imported', 'declined']),
        eventId: importId,
        targetCollection: 'quotes',
      },
      ...meta(created),
    });
    ids.push(docId);
  }
  bw.set(importRef, {
    targetCollection: 'quotes',
    importDocIds: ids,
    docCreationErrors: [],
    invalidRows: faker.datatype.boolean() ? [{ rowNum: 1, rowData: {} }] : [],
    metadata: { created: ts(created) },
  });
}

// ═══════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════
const C = {
  users: 0,
  agencies: 0,
  submissions: 0,
  quotes: 0,
  policies: 0,
  locations: 0,
  ratingDocs: 0,
  transactions: 0,
  cancelTrx: 0,
  endorsementTrx: 0,
  changeRequests: 0,
  claims: 0,
  receivables: 0,
  finTrx: 0,
  agencyApps: 0,
  emailActivity: 0,
  imports: 0,
  taxConfigs: 0,
  licenses: 0,
  disclosures: 0,
  moratoriums: 0,
};

async function main() {
  console.log(`\n🌱  iDemand Firestore Seed  v2`);
  console.log(`   Agencies:       ${AGENCY_COUNT}`);
  console.log(`   Policies/agent: ${POLICIES_PER_AGENT}`);
  console.log(`   Dry run:        ${DRY_RUN}`);
  console.log(`   Reset first:    ${DO_RESET}\n`);

  if (DO_RESET && !DRY_RUN) await resetCollections();

  const bw = new BatchWriter();

  seedIdemandOrg(bw);
  seedIdemandAdmin(bw);
  C.users++;

  // Config
  for (const st of LICENSE_STATES) {
    seedTaxConfig(bw, st);
    C.taxConfigs += 2;
    seedLicense(bw, st);
    C.licenses++;
  }
  for (const st of DISC_STATES) {
    seedDisclosure(bw, st);
    C.disclosures++;
  }
  for (let i = 0; i < 2; i++) {
    seedMoratorium(bw, randomState(true));
    C.moratoriums++;
  }

  // Agency apps + imports
  for (let i = 0; i < faker.number.int({ min: 2, max: 4 }); i++) {
    seedAgencyApp(bw);
    C.agencyApps++;
  }
  for (let i = 0; i < 2; i++) {
    seedImport(bw, { state: randomState() });
    C.imports++;
  }

  // Agencies
  for (let ai = 0; ai < AGENCY_COUNT; ai++) {
    const agencyData = await seedAgency(bw, ai);
    C.agencies++;
    const orgData = {
      oid: agencyData.oid,
      orgName: agencyData.orgName,
      stripeAcct: agencyData.stripeAcct,
      address: agencyData.address,
    };
    seedOrgAdmin(bw, agencyData);
    C.users++;

    const agentCount = faker.number.int({ min: 1, max: 2 });
    for (let agi = 0; agi < agentCount; agi++) {
      const agent = seedAgent(bw, agencyData);
      C.users++;

      const subCount = faker.number.int({ min: 1, max: 3 });
      for (let si = 0; si < subCount; si++) {
        seedSubmission(bw, { agent, orgData, state: agencyData.state });
        C.submissions++;
      }

      for (let pi = 0; pi < POLICIES_PER_AGENT; pi++) {
        const insuredUser = await seedInsuredUser(bw);
        C.users++;
        const state = agencyData.state;
        const limits = fakeLimits();
        const rcvs = fakeRCVs(limits);
        const deductible = fakeDeductible();
        const rpd = fakeRatingPropData();
        const coords = fakeCoords(state);
        const { AALs, premiumCalcData } = fakePremCalc(limits);
        const annual = premiumCalcData.annualPremium;
        const fees = fakeFeeItems();
        const taxes = fakeTaxItems(annual, state);

        const daysAgo = faker.number.int({ min: 30, max: 340 });
        const effDate = sub(new Date(), { days: daysAgo });
        const expDate = add(effDate, { years: 1 });
        const { termPremium, termDays, dailyPremium } = calcTerm(
          annual,
          effDate,
          expDate,
        );

        const policyDocId = mkPolicyId();
        const locationDocId = mkLocationId();

        const ratingDocId = seedRatingDoc(bw, {
          limits,
          rcvs,
          deductible,
          coords,
          ratingPropData: rpd,
          AALs,
          premiumCalcData,
          locationDocId,
        });
        C.ratingDocs++;
        seedLocation(bw, {
          locationDocId,
          policyDocId,
          limits,
          rcvs,
          deductible,
          coords,
          ratingPropData: rpd,
          ratingDocId,
          effDate,
          expDate,
          termPremium,
          termDays,
          annualPremium: annual,
          state,
        });
        C.locations++;
        const policyLoc = seedPolicy(bw, {
          policyDocId,
          locationDocId,
          agent,
          orgData,
          insuredUser,
          limits,
          termPremium,
          annualPremium: annual,
          state,
          effDate,
          expDate,
          termDays,
          fees,
          taxes,
          ratingDocId,
        });
        C.policies++;
        seedQuote(bw, { agent, orgData, insuredUser, state });
        C.quotes++;
        seedPremTrx(bw, {
          policyDocId,
          locationDocId,
          agent,
          orgData,
          insuredUser,
          state,
          effDate,
          expDate,
          limits,
          rcvs,
          deductible,
          ratingPropData: rpd,
          termPremium,
          dailyPremium,
          termDays,
          annualPremium: annual,
          premCalcData: premiumCalcData,
          fees,
          taxes,
        });
        C.transactions++;

        // Receivable uses the real stripe customer ID stored on the user
        const loc4rec = {
          termPremium,
          annualPremium: annual,
          address: compressAddress(fakeAddress(state)),
          coords: new GeoPoint(coords.latitude, coords.longitude),
          billingEntityId: insuredUser.id,
        };
        seedReceivable(bw, {
          policyDocId,
          locationDocId,
          insuredUser,
          termPremium,
          taxes,
          fees,
          effDate,
          stripeCustomerId: insuredUser.stripeCustomerId,
          policyLoc: loc4rec,
        });
        C.receivables++;
        seedFinTrx(bw, {
          policyDocId,
          insuredUser,
          agent,
          orgData,
          termPremium,
          taxes,
          fees,
          effDate,
        });
        C.finTrx++;

        if (faker.datatype.boolean()) {
          seedChangeRequest(bw, {
            policyDocId,
            locationDocId,
            agent,
            orgData,
            insuredUser,
            effDate,
            limits,
          });
          C.changeRequests++;
          seedEndorsementTrx(bw, {
            policyDocId,
            locationDocId,
            agent,
            orgData,
            insuredUser,
            state,
            effDate,
            expDate,
            limits,
            termPremium,
            dailyPremium,
            annualPremium: annual,
            premCalcData: premiumCalcData,
            fees,
            taxes,
          });
          C.endorsementTrx++;
        }
        if (faker.number.int({ min: 1, max: 4 }) === 1) {
          seedCancelTrx(bw, {
            policyDocId,
            locationDocId,
            agent,
            orgData,
            insuredUser,
            state,
            effDate,
            expDate,
            termPremium,
            dailyPremium,
            taxes,
            fees,
          });
          C.cancelTrx++;
        }
        if (faker.number.int({ min: 1, max: 3 }) === 1) {
          seedClaim(bw, { policyDocId, locationDocId, insuredUser });
          C.claims++;
        }
        for (let ei = 0; ei < faker.number.int({ min: 1, max: 2 }); ei++) {
          seedEmailActivity(bw, { policyDocId, insuredUser });
          C.emailActivity++;
        }
      }
    }
  }

  await bw.commit();

  // Summary
  const rows = [
    ['Tax definitions (config)', C.taxConfigs],
    ['Licenses', C.licenses],
    ['Disclosures', C.disclosures],
    ['Moratoriums', C.moratoriums],
    ['Agency applications', C.agencyApps],
    ['Import summaries', C.imports],
    ['Organizations', C.agencies + 1],
    ['Users', C.users],
    ['Submissions', C.submissions],
    ['Quotes', C.quotes],
    ['Rating docs', C.ratingDocs + C.quotes],
    ['Locations', C.locations],
    ['Policies', C.policies],
    ['├─ Change requests', C.changeRequests],
    ['└─ Claims', C.claims],
    ['Transactions (new prem)', C.transactions],
    ['├─ Endorsement pairs', C.endorsementTrx],
    ['└─ Cancellations', C.cancelTrx],
    ['Receivables', C.receivables],
    ['Financial transactions', C.finTrx],
    ['Email activity', C.emailActivity],
    ['─────────────────────────────────────────', ''],
    ['Total Firestore writes', bw.total],
  ];
  console.log('\n📊  Seed summary');
  const pad = Math.max(...rows.map(([l]) => l.length));
  for (const [l, v] of rows)
    console.log(`   ${l.padEnd(pad + 2)}${String(v).padStart(5)}`);
  console.log(
    DRY_RUN ? '\n⚠️   DRY RUN – nothing written.\n' : '\n✅  Done!\n',
  );
}

main().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
