export enum COLLECTIONS {
  SUBMISSIONS = 'submissions',
  PROPERTY_DATA_RES = 'propertyDataRes',
  // QUOTES = 'submissionsQuotes',
  QUOTES = 'quotes',
  RATING_DATA = 'ratingData',
  USERS = 'users',
  POLICIES = 'policies',
  CHANGE_REQUESTS = 'changeRequests',
  ORGANIZATIONS = 'organizations',
  INVITES = 'invitations',
  USER_CLAIMS = 'userClaims',
  QUOTE_HISTORY = 'quoteHistory',
  RATING_DATA_HISTORY = 'ratingDataHistory',
  SK_RES = 'spatialKey',
  SR_RES = 'swissReRes',
  PAYMENT_METHODS = 'paymentMethods',
  TRANSACTIONS = 'transactions',
  FIN_TRANSACTIONS = 'financialTransactions',
  AGENCY_APPLICATIONS = 'agencySubmissions',
  LICENSES = 'licenses',
  NOTIFICATIONS = 'notifications',
  DATA_IMPORTS = 'dataImports',
  EMAIL_ACTIVITY = 'emailActivity',
  MORATORIUMS = 'moratoriums',
}

export enum SUBMISSION_STATUS {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  PENDING_INFO = 'pending_info',
  CANCELLED = 'cancelled',
  QUOTED = 'quoted',
  NOT_ELIGIBLE = 'ineligible',
}

export enum INVITE_STATUS {
  ACCECPTED = 'accepted',
  PENDING = 'pending',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
  REPLACED = 'replaced',
  REJECTED = 'rejected',
  ERROR = 'error', // remove ??
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

export enum FIN_TRANSACTION_STATUS {
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  PAYMENT_FAILED = 'payment_failed',
}

export enum PRODUCT {
  Flood = 'flood',
  Wind = 'wind',
}

export enum AGENCY_SUBMISSION_STATUS {
  ACCECPTED = 'accepted',
  SUBMITTED = 'submitted',
  REVIEW_REQUIRED = 'review:required',
  REJECTED = 'rejected',
}

export enum AGENCY_STATUS {
  SUBMITTED = 'submitted',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_INFO = 'pending_info',
}

export enum UW_NOTE_CODE {
  REQUIRES_REVIEW = 'requires-review',
  NOT_RATABLE = 'not-ratable',
  UNKNOWN = 'unknown',
}

export enum CLAIMS {
  IDEMAND_ADMIN = 'iDemandAdmin',
  IDEMAND_USER = 'iDemandUser',
  ORG_ADMIN = 'orgAdmin',
  AGENT = 'agent',
}

// export enum FIN_TRANSACTION_STATUS {

// }

export enum TRANSACTION_TYPE {
  CHARGE = 'charge',
  REFUND = 'refund',
}

export enum PUB_SUB_TOPICS {
  PAYMENT_COMPLETE = 'payment.complete',
  POLICY_CREATED = 'policy.created',
  POLICY_RENEWAL = 'policy.renewal',
  POLICY_PREM_ENDORSEMENT = 'policy.prem_endorsement',
  POLICY_NON_PREM_ENDORSEMENT = 'policy.non_prem_endorsement',
  POLICY_REINSTATEMENT = 'policy.reinstatement',
  POLICY_CANCELLATION = 'policy.cancellation',
}
