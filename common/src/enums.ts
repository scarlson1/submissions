import { z } from 'zod';

export const Collection = z.enum([
  'taxes',
  'moratoriums',
  'locations',
  'licenses',
  'submissions',
  'policies',
  'users',
  'organizations',
  'quotes',
  'swissReRes',
  'propertyDataRes',
  'ratingData',
  'changeRequests',
  'claims',
  'invitations',
  'userClaims',
  'paymentMethods', // delete ?? ePay
  'transactions',
  'financialTransactions',
  'taxTransactions',
  'taxCalculations',
  'agencySubmissions',
  'disclosures',
  'notifications',
  'notifyRegistration',
  'dataImports',
  'stagedDocs',
  'emailActivity',
  'portfolioSubmissions',
  'versions',
  'permissions', // TODO: switch to privileged / secure
  'states', // active states by productId
  'receivables',
  'billingEntities',
  'public',
  'portfolioExposure',
  'portfolioConcentrationAlerts',
  'taxReconciliationErrors',
  'config',
]);
export type Collection = z.infer<typeof Collection>;
export type TCollection = z.infer<typeof Collection>;

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

export const Claim = z.enum([
  'iDemandAdmin',
  'iDemandUser',
  'orgAdmin',
  'agent',
]);
export type Claim = z.infer<typeof Claim>;

export const ClaimArray = z.array(Claim);
export type ClaimArray = z.infer<typeof ClaimArray>;

export const SubmissionStatus = z.enum([
  'draft',
  'submitted',
  'under_review',
  'pending_info',
  'cancelled',
  'quoted',
  'ineligible',
]);
export type SubmissionStatus = z.infer<typeof SubmissionStatus>;

export const SubjectBaseItem = z.enum([
  'premium',
  'inspectionFees',
  'mgaFees',
  'outStatePremium',
  'homeStatePremium',
  'fixedFee',
  'noFee',
]);
export type SubjectBaseItem = z.infer<typeof SubjectBaseItem>;

export const Product = z.enum(['flood', 'wind']);
export type Product = z.infer<typeof Product>;

export const RoundingType = z.enum(['nearest', 'up', 'down']);
export type RoundingType = z.infer<typeof RoundingType>;

export const LineOfBusiness = z.enum(['residential', 'commercial']);
export type LineOfBusiness = z.infer<typeof LineOfBusiness>;

export const CommSource = z.enum(['agent', 'org', 'default']);
export type CommSource = z.infer<typeof CommSource>;

export const ChangeRequestTrxType = z.enum([
  'endorsement',
  'amendment',
  'cancellation',
  'flat_cancel',
  'reinstatement',
]);
export type ChangeRequestTrxType = z.infer<typeof ChangeRequestTrxType>;

export const TransactionType = z.enum([
  ...ChangeRequestTrxType.options,
  'new',
  'renewal',
] as const);
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

export const LicenseOwner = z.enum(['individual', 'organization']);
export type LicenseOwner = z.infer<typeof LicenseOwner>;

export const LicenseType = z.enum([
  'producer',
  'surplus lines',
  'MGA',
  'Tax ID',
]);
export type LicenseType = z.infer<typeof LicenseType>;

export const Basement = z.enum(['no', 'finished', 'unfinished', 'unknown']);
export type Basement = z.infer<typeof Basement>;

export const CBRSDesignation = z.enum(['IN', 'OUT']);
export type CBRSDesignation = z.infer<typeof CBRSDesignation>;

export const PriorLossCount = z.enum(['0', '1', '2', '3']);
export type PriorLossCount = z.infer<typeof PriorLossCount>;

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
export type FloodZone = z.infer<typeof FloodZone>;

export const CancelReason = z.enum([
  'sold',
  'premium_pmt_failure',
  'exposure_change',
  'insured_choice',
]);
export type CancelReason = z.infer<typeof CancelReason>;

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

export const BillingType = z.enum(['checkout', 'invoice', 'mortgagee']);
export type TillingType = z.infer<typeof BillingType>;

// export const DefaultCommission = z.map(Product, z.number());
// export type DefaultCommission = z.infer<typeof DefaultCommission>;

export const DefaultCommission = z.object({
  flood: z.number().nonnegative(),
  wind: z.number().nonnegative(),
});
export type DefaultCommission = z.infer<typeof DefaultCommission>;

export const DisclosureType = z.enum([
  'state disclosure',
  'general disclosure',
  'terms & conditions',
  'other',
]);
export type DisclosureType = z.infer<typeof DisclosureType>;

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

export const PolicyClaimStatus = z.enum([
  'draft',
  'submitted',
  'under_review',
  'approved',
  'denied',
  'paid',
  'closed',
]);
export type PolicyClaimStatus = z.infer<typeof PolicyClaimStatus>;

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

export enum RENEWAL_PUB_SUB_TOPICS {
  RENEWAL_REQUESTED = 'policy.renewal.requested',
  RENEWAL_APPROVED = 'policy.renewal.approved',
  RENEWAL_LAPSED = 'policy.renewal.lapsed',
}

export const RenewalPubSubTopics = z.nativeEnum(RENEWAL_PUB_SUB_TOPICS);
export type RenewalPubSubTopics = z.infer<typeof RenewalPubSubTopics>;

export const RenewalStatus = z.enum([
  'pending',
  'quoted',
  'bound',
  'lapsed',
  'non_renewed',
]);
export type RenewalStatus = z.infer<typeof RenewalStatus>;

export const TrxPubSubTopics = z.nativeEnum(TRX_PUB_SUB_TOPICS);
export type TrxPubSubTopics = z.infer<typeof TrxPubSubTopics>;

// stripe
export enum PAYMENT_PUB_SUB_TOPICS {
  CHARGE_SUCCEEDED = 'charge.succeeded',
  REFUND_CREATED = 'refund.created',
}

export const PaymentPubSubTopics = z.nativeEnum(PAYMENT_PUB_SUB_TOPICS);
export type PaymentPubSubTopics = z.infer<typeof PaymentPubSubTopics>;

export enum PIPELINE_PUB_SUB_TOPICS {
  TAX_RECONCILIATION_ERROR = 'tax_reconciliation_error',
}

export const PipelinePubSubTopics = z.nativeEnum(PIPELINE_PUB_SUB_TOPICS);
export type PipelinePubSubTopics = z.infer<typeof PipelinePubSubTopics>;

// TODO: need to use zod enum to combine
// export const PubSubTopics = z.enum([...MiscPubSubTopics.options, ...PmtPubSubTopics.options, ...TrxPubSubTopics.options] as const);

// export const PubSubTopics = z.union([TrxPubSubTopics, PmtPubSubTopics, MiscPubSubTopics])
// export type PubSubTopics = z.infer<typeof PubSubTopics>

export const PUB_SUB_TOPICS = {
  ...MISC_PUB_SUB_TOPICS,
  ...PMT_PUB_SUB_TOPICS,
  ...TRX_PUB_SUB_TOPICS,
  ...RENEWAL_PUB_SUB_TOPICS,
  ...PAYMENT_PUB_SUB_TOPICS,
  ...PIPELINE_PUB_SUB_TOPICS,
};
