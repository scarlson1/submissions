export enum COLLECTIONS {
  SUBMISSIONS = 'submissions',
  QUOTES = 'quotes',
  SUBMISSIONS_QUOTES = 'submissionsQuotes',
  RATING_DATA = 'ratingData',
  USERS = 'users',
  POLICIES = 'policies',
  // POLICIES_TEMP = 'policiesTemp',
  ORGANIZATIONS = 'organizations',
  USER_CLAIMS = 'userClaims',
  INVITES = 'invitations',
  QUOTE_HISTORY = 'quoteHistory',
  RATING_DATA_HISTORY = 'ratingDataHistory',
  SK_RES = 'spatialKey',
  SR_RES = 'swissRe',
  PAYMENT_METHODS = 'paymentMethods',
  TRANSACTIONS = 'transactions',
  AGENCY_APPLICATIONS = 'agencySubmissions',
  LICENSES = 'licenses',
  NOTIFICATIONS = 'notifications',
  NOTIFY_REGISTRATION = 'notifyRegistration',
  TAXES = 'surplusLinesTaxes',
  ACTIVE_STATES = 'states',
  MORATORIUMS = 'moratoriums',
  PUBLIC = 'public',
  DISCLOSURES = 'disclosures',
  TASKS = 'tasks', // TODO: DELETE
}

// TODO: separate out submission status and quote status
export enum SUBMISSION_STATUS {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  // APPROVED = 'approved',
  // REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
  PENDING_INFO = 'pending_info',
  // EXPIRED = 'expired',
  CANCELLED = 'cancelled',
  // AWAITING_USER = 'awaiting:user',
  // AWAITING_PAYMENT = 'awaiting:payment',
  QUOTED = 'quoted',
  NOT_ELIGIBLE = 'ineligible',
}

// export enum QUOTE_STATUS {
//   COMPLETE = 'bound',
//   PAID = 'paid',
//   AWAITING_USER = 'awaiting:user',
//   AWAITING_PAYMENT = 'awaiting:payment',
//   PROCESSING_PAYMENT = 'processing:payment',
//   CANCELLED = 'cancelled',
//   EXPIRED = 'expired',
// }
export enum QUOTE_STATUS {
  DRAFT = 'draft',
  AWAITING_USER = 'awaiting:user',
  BOUND = 'bound',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum POLICY_STATUS {
  PAID = 'paid',
  PAYMENT_PROCESSING = 'processing:payment',
  AWAITING_PAYMENT = 'awaiting:payment',
  CANCELLED = 'cancelled',
}

export enum TRANSACTION_TYPE {
  CHARGE = 'charge',
  REFUND = 'refund',
}

export enum PRODUCT {
  FLOOD = 'flood',
  WIND = 'wind',
}

export enum UW_NOTE_CODE {
  REQUIRES_REVIEW = 'requires-review',
  NOT_RATABLE = 'not-ratable',
  UNKNOWN = 'unknown',
}

export enum DEDUCTIBLE_OPTIONS {
  pct = 'percent',
  abs = 'absolute',
}

export enum STATE_ABBREVIATION {
  AL = 'AL',
  AK = 'AK',
  AZ = 'AZ',
  AR = 'AR',
  CA = 'CA',
  CO = 'CO',
  CT = 'CT',
  DE = 'DE',
  DC = 'DC',
  FL = 'FL',
  GA = 'GA',
  HI = 'HI',
  ID = 'ID',
  IL = 'IL',
  IN = 'IN',
  IA = 'IA',
  KS = 'KS',
  KY = 'KY',
  LA = 'LA',
  ME = 'ME',
  MD = 'MD',
  MA = 'MA',
  MI = 'MI',
  MN = 'MN',
  MS = 'MS',
  MO = 'MO',
  MT = 'MT',
  NE = 'NE',
  NV = 'NV',
  NH = 'NH',
  NJ = 'NJ',
  NM = 'NM',
  NY = 'NY',
  NC = 'NC',
  ND = 'ND',
  OH = 'OH',
  OK = 'OK',
  OR = 'OR',
  PA = 'PA',
  RI = 'RI',
  SC = 'SC',
  SD = 'SD',
  TN = 'TN',
  TX = 'TX',
  UT = 'UT',
  VT = 'VT',
  VA = 'VA',
  WA = 'WA',
  WV = 'WV',
  WI = 'WI',
  WY = 'WY',
}
