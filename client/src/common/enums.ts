import { z } from 'zod';

export enum COLLECTIONS {
  SUBMISSIONS = 'submissions',
  PORTFOLIO_SUBMISSIONS = 'portfolioSubmissions',
  QUOTES = 'quotes',
  LOCATIONS = 'locations',
  RATING_DATA = 'ratingData',
  USERS = 'users',
  BILLING_ENTITIES = 'billingEntities',
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
  PERMISSIONS = 'permissions',
}

const COLLECTIONS_Z = [
  'submissions',
  'portfolioSubmissions',
  'quotes',
  'locations',
  'ratingData',
  'users',
  'billingEntities',
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

// Option 2: native enum --> zod
export const CollectionsEnum2 = z.nativeEnum(COLLECTIONS);
export type Collection2 = z.infer<typeof CollectionsEnum2>;

export const StorageFolder = z.enum([
  'importPolicies',
  'importTransactions',
  'ratePortfolio',
  'importQuotes',
  'policies',
  'claims',
  'users',
  'profileImages',
]);
export type TStorageFolder = z.infer<typeof StorageFolder>;

export const CancelReason = z.enum([
  'sold',
  'premium_pmt_failure',
  'exposure_change',
  'insured_choice',
]);
export type TCancelReason = z.infer<typeof CancelReason>;

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

export const PolicyStatus = z.enum(['active', 'cancelled', 'cancel:pending', 'expired', 'pending']);
export type TPolicyStatus = z.infer<typeof PolicyStatus>;

export const PaymentStatus = z.enum([
  'paid',
  'processing',
  'awaiting_payment',
  'cancelled',
  'error',
  'declined',
  'payment_failed',
]);
export type TPaymentStatus = z.infer<typeof PaymentStatus>;

export const AgencySubmissionStatus = z.enum([
  'accepted',
  'submitted',
  'review:required',
  'rejected',
]);
export type TAgencySubmissionStatus = z.infer<typeof AgencySubmissionStatus>;

export const ChangeRequestStatus = z.enum([
  'draft',
  'submitted',
  'accepted',
  'denied',
  'under_review',
  'cancelled',
  'error',
]); // z.nativeEnum(CHANGE_REQUEST_STATUS);
export type TChangeRequestStatus = z.infer<typeof ChangeRequestStatus>;

export const SubmittedChangeRequestStatus = ChangeRequestStatus.exclude(['draft']);
export type TSubmittedChangeRequestStatus = z.infer<typeof SubmittedChangeRequestStatus>;

export enum INVITE_STATUS {
  ACCEPTED = 'accepted',
  PENDING = 'pending',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  REPLACED = 'replaced',
  REJECTED = 'rejected',
  ERROR = 'error',
}

export const InviteStatus = z.enum([
  'accepted',
  'pending',
  'revoked',
  'expired',
  'replaced',
  'rejected',
  'error',
]);
export type TInviteStatus = z.infer<typeof InviteStatus>;

export enum FIN_TRANSACTION_TYPE {
  CHARGE = 'charge',
  REFUND = 'refund',
}

export const Product = z.enum(['flood', 'wind']);
export type TProduct = z.infer<typeof Product>;

export enum UW_NOTE_CODE {
  REQUIRES_REVIEW = 'requires-review',
  NOT_RATABLE = 'not-ratable',
  UNKNOWN = 'unknown',
}

export const Basement = z.enum(['no', 'finished', 'unfinished', 'unknown']);
export type TBasement = z.infer<typeof Basement>;

export const CBRSDesignation = z.enum(['IN', 'OUT']);
export type TCBRSDesignation = z.infer<typeof CBRSDesignation>;

export const PriorLossCount = z.enum(['0', '1', '2', '3']);
export type TPriorLossCount = z.infer<typeof PriorLossCount>;

export const FloodZone = z.enum(['A', 'B', 'C', 'D', 'V', 'X', 'AE', 'AO', 'AH', 'AR', 'VE']);
export type TFloodZone = z.infer<typeof FloodZone>;

export const FeeItemName = z.enum(['Inspection Fee', 'MGA Fee', 'UW Adjustment']);
export type TFeeItemName = z.infer<typeof FeeItemName>;

export const RoundingType = z.enum(['nearest', 'up', 'down']);
export type TRoundingType = z.infer<typeof RoundingType>;

export const TaxItemName = z.enum([
  'Premium Tax',
  'Service Fee',
  'Stamping Fee',
  'Regulatory Fee',
  'Windpool Fee',
  'Surcharge',
  'EMPA Surcharge',
  'Bureau of Insurance Assessment',
]);
export type TTaxItemName = z.infer<typeof TaxItemName>;

export const TaxRateType = z.enum(['fixed', 'percent']);
export type TTaxRateType = z.infer<typeof TaxRateType>;

export const SubjectBaseItem = z.enum([
  'premium',
  'inspectionFees',
  'mgaFees',
  'outStatePremium',
  'homeStatePremium',
  'fixedFee',
  'noFee',
]);
export type TSubjectBaseItem = z.infer<typeof SubjectBaseItem>;

export const LineOfBusiness = z.enum(['residential', 'commercial']);
export type TLineOfBusiness = z.infer<typeof LineOfBusiness>;

export const ChangeRequestTrxType = z.enum([
  'endorsement',
  'amendment',
  'cancellation',
  'flat_cancel',
  'reinstatement',
]);
export type TChangeRequestTrxType = z.infer<typeof ChangeRequestTrxType>;

export const TransactionType = z.enum([...ChangeRequestTrxType.options, 'new', 'renewal'] as const);
export type TTransactionType = z.infer<typeof TransactionType>;

export const LicenseOwner = z.enum(['individual', 'organization']);
export type TLicenseOwner = z.infer<typeof LicenseOwner>;

export const LicenseType = z.enum(['producer', 'surplus lines', 'MGA', 'Tax ID']);
export type TLicenseType = z.infer<typeof LicenseType>;

export const DisclosureType = z.enum([
  'state disclosure',
  'general disclosure',
  'terms & conditions',
  'other',
]);
export type TDisclosureType = z.infer<typeof DisclosureType>;

export enum DEDUCTIBLE_OPTIONS {
  pct = 'percent',
  abs = 'absolute',
}

// TODO: zod enum
export enum CLAIMS {
  ORG_ADMIN = 'orgAdmin',
  IDEMAND_ADMIN = 'iDemandAdmin',
  AGENT = 'agent',
}

export enum LOCAL_STORAGE {
  USER_SEARCH_KEY = 'userSearchKey',
}

export const State = z.enum([
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'DC',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
]);
export type TState = z.infer<typeof State>;

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
