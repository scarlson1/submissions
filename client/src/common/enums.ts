import { z } from 'zod';

// export const Collection = z.enum([
//   'submissions',
//   'portfolioSubmissions',
//   'quotes',
//   'locations',
//   'ratingData',
//   'users',
//   'billingEntities',
//   'policies',
//   'changeRequests',
//   'claims',
//   'organizations',
//   'userClaims',
//   'invitations',
//   'propertyDataRes',
//   'swissReRes',
//   'paymentMethods',
//   'transactions',
//   'financialTransactions',
//   'taxTransactions',
//   'taxCalculations',
//   'agencySubmissions',
//   'licenses',
//   'notifications',
//   'notifyRegistration',
//   // 'surplusLinesTaxes',
//   'taxes',
//   'states',
//   'moratoriums',
//   'public',
//   'disclosures',
//   'emailActivity',
//   'dataImports',
//   'stagedDocs',
//   'tasks', // TODO: DELETE
//   'versions',
//   'permissions', // TODO: rename to privileged or secure etc.
//   'receivables',
// ]);
// export type TCollection = z.infer<typeof Collection>;

export const CancelReason = z.enum([
  'sold',
  'premium_pmt_failure',
  'exposure_change',
  'insured_choice',
]);
export type TCancelReason = z.infer<typeof CancelReason>;

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

export const PolicyStatus = z.enum([
  'active',
  'cancelled',
  'cancel:pending',
  'expired',
  'pending',
]);
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

export const SubmittedChangeRequestStatus = ChangeRequestStatus.exclude([
  'draft',
]);
export type TSubmittedChangeRequestStatus = z.infer<
  typeof SubmittedChangeRequestStatus
>;

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

export const DefaultCommission = z.object({
  flood: z.number().nonnegative(),
  wind: z.number().nonnegative(),
});
export type TDefaultCommission = z.infer<typeof DefaultCommission>;

export const CommSource = z.enum(['agent', 'org', 'default']);
export type TCommSource = z.infer<typeof CommSource>;

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

export const FloodZone = z.enum([
  'A',
  'B',
  'C',
  'D',
  'V',
  'X',
  'AE',
  'AO',
  'AH',
  'AR',
  'VE',
]);
export type TFloodZone = z.infer<typeof FloodZone>;

export const FeeItemName = z.enum([
  'Inspection Fee',
  'MGA Fee',
  'UW Adjustment',
]);
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

export const TransactionType = z.enum([
  ...ChangeRequestTrxType.options,
  'new',
  'renewal',
] as const);
export type TTransactionType = z.infer<typeof TransactionType>;

export const LicenseOwner = z.enum(['individual', 'organization']);
export type TLicenseOwner = z.infer<typeof LicenseOwner>;

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

export const Claim = z.enum([
  'iDemandAdmin',
  'iDemandUser',
  'orgAdmin',
  'agent',
]);
export type TClaim = z.infer<typeof Claim>;

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
