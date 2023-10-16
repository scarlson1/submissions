import { z } from 'zod';

export enum COLLECTIONS {
  SUBMISSIONS = 'submissions',
  PROPERTY_DATA_RES = 'propertyDataRes',
  QUOTES = 'quotes',
  LOCATIONS = 'locations',
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
  DISCLOSURES = 'disclosures',
  NOTIFICATIONS = 'notifications',
  DATA_IMPORTS = 'dataImports',
  EMAIL_ACTIVITY = 'emailActivity',
  MORATORIUMS = 'moratoriums',
  STAGED_RECORDS = 'stagedDocs',
  VERSIONS = 'versions', // HISTORY = 'history',
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
  ACCEPTED = 'accepted',
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

export const PaymentStatus = z.enum([
  'paid',
  'processing',
  'awaiting_payment',
  'cancelled',
  'error',
  'declined',
  'payment_failed',
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

// export enum CHANGE_REQUEST_STATUS {
//   DRAFT = 'draft',
//   SUBMITTED = 'submitted',
//   ACCEPTED = 'accepted',
//   DENIED = 'denied',
//   UNDER_REVIEW = 'under_review',
//   CANCELLED = 'cancelled',
//   ERROR = 'error',
// }

export const ChangeRequestStatus = z.enum([
  'draft',
  'submitted',
  'accepted',
  'denied',
  'under_review',
  'cancelled',
  'error',
]); // z.nativeEnum(CHANGE_REQUEST_STATUS);
export type ChangeRequestStatus = z.infer<typeof ChangeRequestStatus>;

export const SubmittedChangeRequestStatus = ChangeRequestStatus.exclude(['draft']);
export type SubmittedChangeRequestStatus = z.infer<typeof SubmittedChangeRequestStatus>;

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
  ACCEPTED = 'accepted',
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

export enum FIN_TRANSACTION_TYPE {
  CHARGE = 'charge',
  REFUND = 'refund',
}

export enum MISC_PUB_SUB_TOPICS {
  LOCATION_IMG = 'location.image',
}

export enum PMT_PUB_SUB_TOPICS {
  PAYMENT_COMPLETE = 'payment.complete',
}

export enum TRX_PUB_SUB_TOPICS {
  // PAYMENT_COMPLETE = 'payment.complete',
  POLICY_CREATED = 'policy.created',
  POLICY_RENEWAL = 'policy.renewal',
  ENDORSEMENT = 'location.endorsement',
  AMENDMENT = 'policy.amendment',
  POLICY_REINSTATEMENT = 'policy.reinstatement',
  // POLICY_CANCELLATION = 'policy.cancellation',
  LOCATION_CANCELLATION = 'location.cancellation',
}

export const PUB_SUB_TOPICS = {
  ...MISC_PUB_SUB_TOPICS,
  ...PMT_PUB_SUB_TOPICS,
  ...TRX_PUB_SUB_TOPICS,
};

// export enum PUB_SUB_TOPICS {
//   PAYMENT_COMPLETE = 'payment.complete',
//   POLICY_CREATED = 'policy.created',
//   POLICY_RENEWAL = 'policy.renewal',
//   POLICY_ENDORSEMENT = 'policy.endorsement',
//   POLICY_AMENDMENT = 'policy.amendment',
//   POLICY_REINSTATEMENT = 'policy.reinstatement',
//   // POLICY_CANCELLATION = 'policy.cancellation',
//   LOCATION_CANCELLATION = 'location.cancellation',
// }
