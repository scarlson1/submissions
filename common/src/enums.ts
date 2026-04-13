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
  'exposureConfig',
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
