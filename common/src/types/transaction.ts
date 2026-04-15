import z from 'zod';
import type { Product, TransactionType } from '../enums.js';
import type {
  Address,
  AgencyDetails,
  AgentDetails,
  BaseDoc,
  Limits,
  OptionalKeys,
  RatingPropertyData,
  RCVs,
  Timestamp,
  ValueByRiskType,
} from './common.js';
import type { ILocationPolicy } from './location.js';
import type { BillingEntity, Totals } from './policy.js';
import type { RatingPremCalcData } from './ratingData.js';

export interface PremiumCalcData {
  techPremium: ValueByRiskType & { total: number };
  floodCategoryPremium: ValueByRiskType;
  premiumSubtotal: number;
  provisionalPremium: number;
  subproducerAdj: number;
  subproducerCommissionPct: number;
  minPremium: number;
  minPremiumAdj: number;
  annualPremium: number;
  MGACommission: number;
  MGACommissionPct: number;
}

export interface TrxRatingData extends RatingPropertyData {
  units: number | null;
  tier1: boolean | null;
  construction: string;
  // priorLossCount: string | null;
}

export interface BaseTransaction extends BaseDoc {
  trxType: TransactionType;
  product: Product;
  policyId: string;
  locationId: string;
  externalId: string | null;
  term: number;
  // reportDate: Timestamp; // calc in report query
  bookingDate: Timestamp; // later of trx timestamp (now/created) or trx eff date
  issuingCarrier: string;
  namedInsured: string;
  mailingAddress: Address;
  agent: AgentDetails;
  agency: AgencyDetails;
  homeState: string;
  policyEffDate: Timestamp;
  policyExpDate: Timestamp;
  trxEffDate: Timestamp;
  trxExpDate: Timestamp;
  trxDays: number; // trxExpDate - trxEffDate
  eventId: string | null;
}

export const CancellationReason = z.enum([
  'sold',
  'premium_pmt_failure',
  'exposure_change',
  'insured_choice',
]);
export type CancellationReason = z.infer<typeof CancellationReason>;

export type OffsetTrxType = 'endorsement' | 'cancellation' | 'flat_cancel';

export interface OffsetTransaction extends BaseTransaction {
  trxType: OffsetTrxType;
  trxInterfaceType: 'offset';
  insuredLocation: ILocationPolicy;
  termPremium: number;
  MGACommission: number; // idemand & subproducer
  MGACommissionPct: number;
  netDWP: number;
  dailyPremium: number;
  netErrorAdj?: number;
  surplusLinesTax: number;
  surplusLinesRegulatoryFee: number;
  MGAFee: number;
  inspectionFee: number;
  // cancelEffDate: Timestamp; // same as trxEffDate ??
  cancelReason: CancellationReason | null;
  previousPremiumTrxId: string;
  // require premiumCalcData ??
}

export type PremTrxType = 'new' | 'renewal' | 'endorsement' | 'reinstatement';

// TODO: need to add policy level data (policy price, taxes, fees, etc.)

export interface PremiumTransaction extends BaseTransaction {
  trxType: PremTrxType;
  trxInterfaceType: 'premium';
  insuredLocation: ILocationPolicy;
  ratingPropertyData: TrxRatingData;
  deductible: number;
  limits: Limits;
  TIV: number;
  RCVs: RCVs;
  premiumCalcData: RatingPremCalcData;
  locationAnnualPremium: number;
  termPremium: number;
  MGACommission: number; // idemand & subproducer
  MGACommissionPct: number;
  netDWP: number;
  dailyPremium: number;
  termProratedPct: number;
  netErrorAdj?: number;
  surplusLinesTax: number;
  surplusLinesRegulatoryFee: number;
  MGAFee: number;
  inspectionFee: number;
  otherInterestedParties: string[];
  additionalNamedInsured: string[];
  billingEntityId: string;
  billingEntity: BillingEntity;
  billingEntityTotals: Totals;
}

export interface AmendmentTransaction extends BaseTransaction {
  trxType: 'amendment'; // 'non_prem_endorsement';
  trxInterfaceType: 'amendment';
  // insuredLocation?: OptionalKeys<ILocation, 'metadata' | 'parentType'>;
  insuredLocation?: OptionalKeys<ILocationPolicy, 'metadata'>;
  otherInterestedParties?: string[];
  additionalNamedInsured?: string[];
  billingEntity?: { displayName: string; id: string };
}

export type Transaction =
  | PremiumTransaction
  | OffsetTransaction
  | AmendmentTransaction;
