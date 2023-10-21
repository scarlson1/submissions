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

// TODO: switch to zod enum
export const Collection = z.nativeEnum(COLLECTIONS);
export type Collection = z.infer<typeof Collection>;

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

// TODO: should match payment status in payment processor (stripe/epay) ??
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

export const Product = z.enum(['flood', 'wind']);
export type Product = z.infer<typeof Product>;

export const Basement = z.enum(['no', 'finished', 'unfinished', 'unknown']);
export type Basement = z.infer<typeof Basement>;

export const CBRSDesignation = z.enum(['IN', 'OUT']);
export type CBRSDesignation = z.infer<typeof CBRSDesignation>;

export const PriorLossCount = z.enum(['0', '1', '2', '3']);
export type PriorLossCount = z.infer<typeof PriorLossCount>;

export const FloodZone = z.enum(['A', 'B', 'C', 'D', 'V', 'X', 'AE', 'AO', 'AH', 'AR', 'VE']);
export type FloodZone = z.infer<typeof FloodZone>;

export const FeeItemName = z.enum(['Inspection Fee', 'MGA Fee', 'UW Adjustment']);
export type FeeItemName = z.infer<typeof FeeItemName>;

export const RoundingType = z.enum(['nearest', 'up', 'down']);
export type RoundingType = z.infer<typeof RoundingType>;

export const SubjectBaseItems = z.enum([
  'premium',
  'inspectionFees',
  'mgaFees',
  'outStatePremium',
  'homeStatePremium',
  'fixedFee',
  'noFee',
]);
export type SubjectBaseItems = z.infer<typeof SubjectBaseItems>;

export const LineOfBusiness = z.enum(['residential', 'commercial']);
export type LineOfBusiness = z.infer<typeof LineOfBusiness>;

export const ChangeRequestTrxType = z.enum([
  'endorsement',
  'amendment',
  'cancellation',
  'flat_cancel',
  'reinstatement',
]);
export type ChangeRequestTrxType = z.infer<typeof ChangeRequestTrxType>;

export const TransactionType = z.enum([...ChangeRequestTrxType.options, 'new', 'renewal'] as const);
export type TransactionType = z.infer<typeof TransactionType>;

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
export type TaxItemName = z.infer<typeof TaxItemName>;

export const TaxRateType = z.enum(['fixed', 'percent']);
export type TaxRateType = z.infer<typeof TaxRateType>;

export const CancelReason = z.enum([
  'sold',
  'premium_pmt_failure',
  'exposure_change',
  'insured_choice',
]);
export type CancelReason = z.infer<typeof CancelReason>;

export const LicenseOwner = z.enum(['individual', 'organization']);
export type LicenseOwner = z.infer<typeof LicenseOwner>;

export const LicenseType = z.enum(['producer', 'surplus lines', 'MGA', 'Tax ID']);
export type LicenseType = z.infer<typeof LicenseType>;

export const AgencySubmissionStatus = z.enum([
  'accepted',
  'submitted',
  'review:required',
  'rejected',
]);
export type AgencySubmissionStatus = z.infer<typeof AgencySubmissionStatus>;

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

// TODO: switch to zod enum
// export const Claims = z.enum(['iDemandAdmin', 'iDemandUser', 'orgAdmin', 'agent']);
export const Claims = z.nativeEnum(CLAIMS);
export type Claims = z.infer<typeof Claims>;

export enum FIN_TRANSACTION_TYPE {
  CHARGE = 'charge',
  REFUND = 'refund',
}

export enum MISC_PUB_SUB_TOPICS {
  LOCATION_IMG = 'location.image',
}
export const MiscPubSubTopics = z.nativeEnum(MISC_PUB_SUB_TOPICS);
export type MiscPubSubTopics = z.infer<typeof MiscPubSubTopics>;

export enum PMT_PUB_SUB_TOPICS {
  PAYMENT_COMPLETE = 'payment.complete',
}
export const PmtPubSubTopics = z.nativeEnum(PMT_PUB_SUB_TOPICS);
export type PmtPubSubTopics = z.infer<typeof PmtPubSubTopics>;

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

export const TrxPubSubTopics = z.nativeEnum(TRX_PUB_SUB_TOPICS);
export type TrxPubSubTopics = z.infer<typeof TrxPubSubTopics>;

// TODO: need to use zod enum to combine
// export const PubSubTopics = z.enum([...MiscPubSubTopics.options, ...PmtPubSubTopics.options, ...TrxPubSubTopics.options] as const);

// export const PubSubTopics = z.union([TrxPubSubTopics, PmtPubSubTopics, MiscPubSubTopics])
// export type PubSubTopics = z.infer<typeof PubSubTopics>

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
export type State = z.infer<typeof State>;
