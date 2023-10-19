import { GeoPoint } from 'firebase-admin/firestore';
import { z } from 'zod';
import {
  Basement,
  FloodZones,
  // AdditionalInsured,
  // Address,
  // AgencyDetails,
  // AgentDetails,
  // FeeItem,
  // Limits,
  // Mortgagee,
  // NamedInsured,
  Nullable,
  PaymentStatus,
  Product,
  // RCVs,
  // RatingPropertyData,
  // SLProdOfRecordDetails,
  State,
} from '../../common/index.js';
import { AALs, ValueByRiskType } from '../../modules/rating/getAALs.js';

export interface ParsedPolicyRow {
  policyId: string | null;
  limits: Limits;
  TIV: number;
  deductible: number;
  address: Nullable<Address>;
  coordinates: GeoPoint | null;
  homeState: string | null;
  RCVs: RCVs;
  annualPremium: number;
  fees: FeeItem[];
  taxes: TaxItem[];
  price: number | null;
  namedInsured: NamedInsured;
  userId: string | null;
  agent: AgentDetails;
  agency: AgencyDetails;
  surplusLinesProducerOfRecord?: SLProdOfRecordDetails;
  issuingCarrier?: string | null;
  quoteId?: string | null;
  effectiveDate: Date | null;
  expirationDate: Date | null;
  policyEffectiveDate: Date | null;
  policyExpirationDate: Date | null;
  cancelEffDate: Date | null;
  cancelReason: string | null;
  externalId: string;
  additionalInsureds: AdditionalInsured[];
  mortgageeInterest: Mortgagee[];
  term: number | null;
  ratingPropertyData: RatingPropertyData;
  ratingDocId?: string;
  product: string;
  mgaCommissionPct: number | null;
  AALs: Nullable<ValueByRiskType>;
  techPremium: Nullable<ValueByRiskType>;
}

export const Limits = z.object({
  limitA: z
    .number()
    .int()
    .min(100000, 'limitA must be > $100k')
    .max(1000000, 'limitA must be < $1M'),
  limitB: z.number().int().max(1000000, 'limitB must be < $1M'),
  limitC: z.number().int().max(1000000, 'limitC must be < $1M'),
  limitD: z.number().int().max(1000000, 'limitD must be < $1M'),
});
export type Limits = z.infer<typeof Limits>;

export const RCVs = z.object({
  building: z.number().int().min(100000),
  otherStructures: z.number().int(),
  contents: z.number().int(),
  BI: z.number().int(),
  total: z.number().int(),
});
export type RCVs = z.infer<typeof RCVs>;

export const Deductible = z.number().int().min(1000);
export type Deductible = z.infer<typeof Deductible>;

export const CBRSDesignation = z.enum(['IN', 'OUT']);
export type CBRSDesignation = z.infer<typeof CBRSDesignation>;

export const PriorLossCount = z.enum(['0', '1', '2', '3']);
export type PriorLossCount = z.infer<typeof PriorLossCount>;

const currentYear = new Date().getFullYear();
export const RatingPropertyData = z.object({
  CBRSDesignation,
  basement: Basement,
  distToCoastFeet: z.number(),
  floodZone: FloodZones,
  numStories: z.number().int().nonnegative(),
  propertyCode: z.string(),
  replacementCost: z.number(),
  sqFootage: z.number(),
  yearBuilt: z
    .number()
    .min(1900, 'year built must be > 1900')
    .max(currentYear + 1, `yearBuilt must be < ${currentYear + 1}`),
  FFH: z.number().int(),
  priorLossCount: PriorLossCount,
});
export type RatingPropertyData = z.infer<typeof RatingPropertyData>;

export const CompressedAddress = z.object({
  s1: z.string(),
  s2: z.string().default(''),
  c: z.string(),
  st: z.string(),
  p: z.string(),
});
export type CompressedAddress = z.infer<typeof CompressedAddress>;

export const Coords = z.object({
  latitude: z.number().min(-90, 'invalid latitude').max(90, 'invalid latitude'),
  longitude: z.number().min(-180, 'invalid longitude').max(180, 'invalid longitude'),
});
export type Coords = z.infer<typeof Coords>;

export const ZodTimestamp = z.object({
  seconds: z.number(),
  nanoseconds: z.number(),
});
export type ZodTimestamp = z.infer<typeof ZodTimestamp>;

export const PolicyLocation = z.object({
  termPremium: z.number().min(100, 'term premium must be > 100'),
  address: CompressedAddress,
  coords: Coords,
  cancelEffDate: ZodTimestamp.optional().nullable(),
  version: z.number().optional(),
});
export type PolicyLocation = z.infer<typeof PolicyLocation>;

export const NamedInsured = z.object({
  displayName: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().min(10).max(12), // .optional(), // allow optional/null ??
  userId: z.string().nullable().optional(),
  orgId: z.string().nullable().optional(),
});
export type NamedInsured = z.infer<typeof NamedInsured>;

export const Address = z.object({
  addressLine1: z.string(),
  addressLine2: z.string().default(''),
  city: z.string(),
  state: z.string(),
  postal: z.string().length(5, 'postal must be 5 digits'),
  countyFIPS: z.string().nullable().optional(),
  countyName: z.string().nullable().optional(),
});
export type Address = z.infer<typeof Address>;

export const MailingAddress = Address.and(
  z.object({
    name: z.string(),
  })
);
export type MailingAddress = z.infer<typeof MailingAddress>;

export const FeeItemName = z.enum(['Inspection Fee', 'MGA Fee', 'UW Adjustment']);
export type FeeItemName = z.infer<typeof FeeItemName>;

export const FeeItem = z.object({
  feeName: FeeItemName,
  value: z.number(),
});
export type FeeItem = z.infer<typeof FeeItem>;

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

export const TaxItem = z.object({
  displayName: TaxItemName,
  rate: z.number(),
  value: z.number(),
  subjectBase: z.array(SubjectBaseItems),
  baseDigits: z.number().int().optional().default(2),
  resultDigits: z.number().int().optional().default(2),
  baseRoundType: RoundingType.optional(),
  resultRoundType: RoundingType,
});
export type TaxItem = z.infer<typeof TaxItem>;
// TODO: extend to get Tax

export const CancelReason = z.enum([
  'sold',
  'premium_pmt_failure',
  'exposure_change',
  'insured_choice',
]);
export type CancelReason = z.infer<typeof CancelReason>;

export const Phone = z.string().min(10).max(12); // TODO: regex ??
export type Phone = z.infer<typeof Phone>;

export const AgentDetails = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: Phone.nullable(),
  userId: z.string(), // TODO: userId --> use z.uuid() ??
});
export type AgentDetails = z.infer<typeof AgentDetails>;

export const AgencyDetails = z.object({
  name: z.string(),
  orgId: z.string(),
  address: Address,
});
export type AgencyDetails = z.infer<typeof AgencyDetails>;

export const AdditionalInsured = z.object({
  name: z.string(),
  email: z.string().email(),
  address: z.nullable(Address).optional().nullable(),
});
export type AdditionalInsured = z.infer<typeof AdditionalInsured>;

export const Mortgagee = z.object({
  name: z.string(),
  contactName: z.string(),
  email: z.string().email(),
  loanNumber: z.string(),
  address: z.nullable(Address).optional().nullable(),
});
export type Mortgagee = z.infer<typeof Mortgagee>;

export const SLProdOfRecordDetails = z.object({
  name: z.string(),
  licenseNum: z.string(),
  licenseState: State,
  phone: Phone.optional().nullable(),
});
export type SLProdOfRecordDetails = z.infer<typeof SLProdOfRecordDetails>;

export const MGACommissionPct = z
  .number()
  .min(0.05, 'Commission must be >= 0.05')
  .max(0.2, 'Commission must be <= 20%');
export type MGACommissionPct = z.infer<typeof MGACommissionPct>;

export const BaseMetadata = z.object({
  created: ZodTimestamp,
  updated: ZodTimestamp,
});
export type BaseMetadata = z.infer<typeof BaseMetadata>;

export const Policy = z.object({
  product: Product,
  paymentStatus: PaymentStatus,
  term: z.number(),
  namedInsured: NamedInsured,
  mailingAddress: MailingAddress,
  locations: z.record(PolicyLocation),
  homeState: State,
  termPremium: z.number().min(100, 'term premium must be > 100'),
  termPremiumWithCancels: z.number(),
  inStatePremium: z.number(),
  outStatePremium: z.number(),
  termDays: z.number().nonnegative(),
  fees: z.array(FeeItem),
  taxes: z.array(TaxItem),
  price: z.number(),
  effectiveDate: ZodTimestamp,
  expirationDate: ZodTimestamp,
  cancelEffDate: ZodTimestamp.optional().nullable(),
  cancelReason: CancelReason.optional().nullable(),
  userId: z.string(),
  agent: AgentDetails,
  agency: AgencyDetails,
  surplusLinesProducerOfRecord: SLProdOfRecordDetails,
  issuingCarrier: z.string(),
  quoteId: z.string(),
  metadata: BaseMetadata,
});
export type Policy = z.infer<typeof Policy>;

export const ParsedPolicyRowZ = z.object({
  policyId: z.string(),
  limits: Limits,
  TIV: z.number(),
  deductible: Deductible,
  address: Address,
  coordinates: Coords,
  homeState: State,
  RCVs: RCVs,
  annualPremium: z.number(),
  fees: z.array(FeeItem),
  taxes: z.array(TaxItem),
  price: z.number().min(100, 'price must be > $100'),
  namedInsured: NamedInsured,
  userId: z.string(),
  agent: AgentDetails,
  agency: AgencyDetails,
  surplusLinesProducerOfRecord: SLProdOfRecordDetails,
  issuingCarrier: z.string().optional(),
  quoteId: z.string().optional(),
  effectiveDate: ZodTimestamp,
  expirationDate: ZodTimestamp,
  policyEffectiveDate: ZodTimestamp,
  policyExpirationDate: ZodTimestamp,
  cancelEffDate: ZodTimestamp.optional().nullable(),
  cancelReason: CancelReason.optional().nullable(),
  externalId: z.string().optional().nullable(),
  additionalInsureds: z.array(AdditionalInsured),
  mortgageeInterest: z.array(Mortgagee),
  term: z.coerce.number().nullable(),
  ratingPropertyData: RatingPropertyData,
  ratingDocId: z.string().optional().nullable().default(null),
  product: Product,
  mgaCommissionPct: MGACommissionPct,
  AALs: AALs,
  techPremium: ValueByRiskType,
});
export type ParsedPolicyRowZ = z.infer<typeof ParsedPolicyRowZ>;
