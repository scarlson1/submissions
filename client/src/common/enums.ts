export enum Collections {
  SUBMISSIONS = 'submissions',
  QUOTES = 'quotes',
  RATING_DATA = 'ratingData',
  USERS = 'users',
  POLICIES = 'policies',
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

export enum DeductibleOptions {
  pct = 'percent',
  abs = 'absolute',
}
