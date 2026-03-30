import { z } from 'zod';

export const StorageFolder = z.enum([
  'importPolicies',
  'importTransactions',
  'ratePortfolio',
  'importQuotes',
  'policies',
  'claims',
  'users',
  'profileImages',
  'locationMapImages',
  'organizations',
]);
export type TStorageFolder = z.infer<typeof StorageFolder>;

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

export const SubmittedChangeRequestStatus = ChangeRequestStatus.exclude([
  'draft',
]);
export type SubmittedChangeRequestStatus = z.infer<
  typeof SubmittedChangeRequestStatus
>;

export enum FIN_TRANSACTION_STATUS {
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  PAYMENT_FAILED = 'payment_failed',
}

export const DisclosureType = z.enum([
  'state disclosure',
  'general disclosure',
  'terms & conditions',
  'other',
]);
export type DisclosureType = z.infer<typeof DisclosureType>;

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

export const Claim = z.enum([
  'iDemandAdmin',
  'iDemandUser',
  'orgAdmin',
  'agent',
]);
export type Claim = z.infer<typeof Claim>;

const ClaimArray = z.array(Claim);
export type ClaimArray = z.infer<typeof ClaimArray>;

export enum FIN_TRANSACTION_TYPE {
  CHARGE = 'charge',
  REFUND = 'refund',
}

export enum MISC_PUB_SUB_TOPICS {
  LOCATION_IMG = 'location.image',
  POLICY_IMG = 'policy.image',
}
export const MiscPubSubTopics = z.nativeEnum(MISC_PUB_SUB_TOPICS);
export type MiscPubSubTopics = z.infer<typeof MiscPubSubTopics>;

// TODO: delete - from epay event handling
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

// stripe
export enum PAYMENT_PUB_SUB_TOPICS {
  CHARGE_SUCCEEDED = 'charge.succeeded',
  REFUND_CREATED = 'refund.created',
}

export const PaymentPubSubTopics = z.nativeEnum(PAYMENT_PUB_SUB_TOPICS);
export type PaymentPubSubTopics = z.infer<typeof PaymentPubSubTopics>;

// TODO: need to use zod enum to combine
// export const PubSubTopics = z.enum([...MiscPubSubTopics.options, ...PmtPubSubTopics.options, ...TrxPubSubTopics.options] as const);

// export const PubSubTopics = z.union([TrxPubSubTopics, PmtPubSubTopics, MiscPubSubTopics])
// export type PubSubTopics = z.infer<typeof PubSubTopics>

export const PUB_SUB_TOPICS = {
  ...MISC_PUB_SUB_TOPICS,
  ...PMT_PUB_SUB_TOPICS,
  ...TRX_PUB_SUB_TOPICS,
  ...PAYMENT_PUB_SUB_TOPICS,
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

export const EmailTemplate = z.enum([
  'contact',
  'policy_doc_delivery',
  'new_quote',
  'agency_approved',
  'invite',
  'policy_change_request',
  'move_to_tenant_verification',
  'email_verification',
  'resend_invite',
  'agency_submission_received',
  'new_submission',
  'payment_complete',
  'quote_expiring',
  'policy_import',
  'quote_import',
  'trx_import',
  'portfolio_rating_complete',
  'claim_submitted',
]);
export type EmailTemplate = z.infer<typeof EmailTemplate>;
