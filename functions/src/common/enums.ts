export enum Collections {
  SUBMISSIONS = 'submissions',
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

export enum SubmissionStatus {
  Draft = 'draft',
  Submitted = 'submitted',
  Approved = 'approved',
  Rejected = 'rejected',
  UnderReview = 'under_review',
  PendingInfo = 'pending_info',
  Expired = 'expired',
  Cancelled = 'cancelled',
  AwaitingPayment = 'awaiting:payment',
}

export enum Product {
  Flood = 'flood',
  Wind = 'wind',
}

export enum UWNoteCode {
  REQUIRES_REVIEW = 'requires-review',
  NOT_RATABLE = 'not-ratable',
  UNKNOWN = 'unknown',
}
