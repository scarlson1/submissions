import { z } from 'zod';

export enum COLLECTIONS {
  SUBMISSIONS = 'submissions',
  PORTFOLIO_SUBMISSIONS = 'portfolioSubmissions',
  QUOTES = 'quotes',
  LOCATIONS = 'locations',
  RATING_DATA = 'ratingData',
  USERS = 'users',
  POLICIES = 'policies',
  CHANGE_REQUESTS = 'changeRequests',
  CLAIMS = 'claims',
  ORGANIZATIONS = 'organizations',
  USER_CLAIMS = 'userClaims',
  INVITES = 'invitations',
  QUOTE_HISTORY = 'quoteHistory',
  RATING_DATA_HISTORY = 'ratingDataHistory',
  PROPERTY_DATA_RES = 'propertyDataRes',
  SK_RES = 'spatialKey',
  SR_RES = 'swissRe',
  PAYMENT_METHODS = 'paymentMethods',
  TRANSACTIONS = 'transactions',
  FIN_TRANSACTIONS = 'financialTransactions',
  AGENCY_APPLICATIONS = 'agencySubmissions',
  LICENSES = 'licenses',
  NOTIFICATIONS = 'notifications',
  NOTIFY_REGISTRATION = 'notifyRegistration',
  TAXES = 'surplusLinesTaxes',
  ACTIVE_STATES = 'states',
  MORATORIUMS = 'moratoriums',
  PUBLIC = 'public',
  DISCLOSURES = 'disclosures',
  EMAIL_ACTIVITY = 'emailActivity',
  DATA_IMPORTS = 'dataImports',
  STAGED_RECORDS = 'stagedDocs',
  TASKS = 'tasks', // TODO: DELETE
  VERSIONS = 'versions',
}

const COLLECTIONS_Z = [
  'submissions',
  'portfolioSubmissions',
  'quotes',
  'locations',
  'ratingData',
  'users',
  'policies',
  'changeRequests',
  'claims',
  'organizations',
  'userClaims',
  'invitations',
  'quoteHistory',
  'ratingDataHistory',
  'propertyDataRes',
  'spatialKey',
  'swissRe',
  'paymentMethods',
  'transactions',
  'financialTransactions',
  'agencySubmissions',
  'licenses',
  'notifications',
  'notifyRegistration',
  'surplusLinesTaxes',
  'states',
  'moratoriums',
  'public',
  'disclosures',
  'emailActivity',
  'dataImports',
  'stagedDocs',
  'tasks', // TODO: DELETE
  'versions',
] as const;

// TODO: switch Collections enum to zod enum (instead of native enum)
// better for typing props (can use "Collection" for type, then pass CollectionsEnum.Enum.locations)
// Option 1: zod enum
export const CollectionsEnum = z.enum(COLLECTIONS_Z);
export type Collection = z.infer<typeof CollectionsEnum>;
// const testFn = (col: Collection) => {
//   console.log('col: ', col)
// }
// testFn(CollectionsEnum.Enum.locations);
// testFn(CollectionsEnum.enum.locations)

// Option 2: native enum --> zod
export const CollectionsEnum2 = z.nativeEnum(COLLECTIONS);
export type Collection2 = z.infer<typeof CollectionsEnum2>;
// const testFn = (col: Collection2) => {
//   console.log('col: ', col)
// }
// testFn(COLLECTIONS.SUBMISSIONS)
// testFn(CollectionsEnum.enum.CHANGE_REQUESTS)

// TODO: separate out submission status and quote status
export enum SUBMISSION_STATUS {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  PENDING_INFO = 'pending_info',
  CANCELLED = 'cancelled',
  QUOTED = 'quoted',
  NOT_ELIGIBLE = 'ineligible',
}

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

export enum AGENCY_SUBMISSION_STATUS {
  ACCEPTED = 'accepted',
  SUBMITTED = 'submitted',
  REVIEW_REQUIRED = 'review:required',
  REJECTED = 'rejected',
}

export enum CHANGE_REQUEST_STATUS {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  ACCEPTED = 'accepted',
  DENIED = 'denied',
  UNDER_REVIEW = 'under_review',
  CANCELLED = 'cancelled',
  ERROR = 'error',
}

// 'pending' | 'accepted' | 'revoked' | 'replaced' | 'rejected' | 'error';
export enum INVITE_STATUS {
  ACCEPTED = 'accepted',
  PENDING = 'pending',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  REPLACED = 'replaced',
  REJECTED = 'rejected',
  ERROR = 'error',
}

export enum FIN_TRANSACTION_TYPE {
  CHARGE = 'charge',
  REFUND = 'refund',
}

// TODO: replace with zod Product enum
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

export enum CLAIMS {
  ORG_ADMIN = 'orgAdmin',
  IDEMAND_ADMIN = 'iDemandAdmin',
  AGENT = 'agent',
}

export enum LOCAL_STORAGE {
  USER_SEARCH_KEY = 'userSearchKey',
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

export enum REMOTE_CONFIG_KEYS {
  'WELCOME' = 'welcome_message',
}

export enum ANALYTICS_EVENTS {
  CHECKOUT_BEGIN = 'begin_checkout',
  CHECKOUT_PROGRESS = 'checkout_progress',
  CHECKOUT_SET_OPTION = 'set_checkout_option',
  PURCHASE = 'purchase',
  VIEW_CART = 'view_cart',
  VIEW_ITEM = 'view_item',
  VIEW_ITEM_LIST = 'view_item_list',
  VIEW_PROMOTION = 'view_promotion',
  VIEW_QUOTE = 'view_quote',
  SELECT_ITEM = 'select_item',
  SELECT_PROMOTION = 'select_promotion',
  SELECT_CONTENT = 'select_content',
  SHARE = 'share',
  SEARCH = 'search',
  SEARCH_VIEW_RESULTS = 'view_search_results',
  REMOVE_FROM_CART = 'remove_from_cart',
  ADD_TO_CART = 'add_to_cart',
  ADD_TO_WISHLIST = 'add_to_wishlist',
  ADD_PAYMENT_INFO = 'add_payment_info',
  ADD_SHIPPING_INFO = 'add_shipping_info',
  LOGIN = 'login',
  SIGN_UP = 'sign_up',
  EXCEPTION = 'exception',
  SCREEN_VIEW = 'screen_view',
  PAGE_VIEW = 'page_view',
  GENERATE_LEAD = 'generate_lead',
}
