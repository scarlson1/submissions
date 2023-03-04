export enum COLLECTIONS {
  SUBMISSIONS = 'submissions',
  SUBMISSIONS_QUOTES = 'submissionsQuotes',
  QUOTES = 'quotes',
  RATING_DATA = 'ratingData',
  USERS = 'users',
  POLICIES = 'policies',
  ORGANIZATIONS = 'organizations',
  INVITES = 'invitations',
  USER_CLAIMS = 'userClaims',
  QUOTE_HISTORY = 'quoteHistory',
  RATING_DATA_HISTORY = 'ratingDataHistory',
  SK_RES = 'spatialKey',
  SR_RES = 'swissReRes',
  PAYMENT_METHODS = 'paymentMethods',
  TRANSACTIONS = 'transactions',
  AGENCY_APPLICATIONS = 'agencyApplications',
  LICENSES = 'licenses',
  NOTIFICATIONS = 'notifications',
}

export enum SUBMISSION_STATUS {
  Draft = 'draft',
  Submitted = 'submitted',
  Approved = 'approved',
  Rejected = 'rejected',
  UnderReview = 'under_review',
  AwaitingInfo = 'awaiting:info',
  Expired = 'expired',
  Cancelled = 'cancelled',
  AwaitingPayment = 'awaiting:payment',
}

export enum QUOTE_STATUS {
  AWAITING_USER = 'awaiting:user',
  COMPLETE = 'bound',
  PAID = 'paid',
  PAYMENT_PROCESSING = 'processing:payment',
  AWAITING_PAYMENT = 'awaiting:payment',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export enum PRODUCT {
  Flood = 'flood',
  Wind = 'wind',
}

export enum AGENCY_STATUS {
  Active = 'active',
  Inactive = 'inactive',
  PendingInfo = 'pending_info',
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
