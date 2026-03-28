import {
  Address,
  BaseMetadata,
  DeepPartial,
  GeoPoint,
  Limits,
  Nullable,
  RCVs,
  RatingPropertyData,
  ValueByRiskType,
  WithRequired,
} from './common.js';

// export const CommPctSourceOption = z.enum(['default', 'agent', 'org', 'custom']);
// export type CommPctSourceOption = z.infer<typeof CommPctSourceOption>;

// export interface PrivilegedPolicyData {
//   subproducerCommissionPct: number;
//   commPctSource: CommPctSourceOption;
//   metadata: BaseMetadata;
// }

export interface SecondaryFactorMults {
  inland: number;
  surge: number;
  tsunami: number;
  // secondaryFactorMultsByFactor: {
  factors: {
    ffeMult: ValueByRiskType;
    basementMult: number;
    historyMult: Nullable<ValueByRiskType>;
    contentsMult: number;
    ordinanceMult: number;
    distanceToCoastMult: number;
    tier1Mult: number;
  };
}

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

export type RatingPremCalcData = WithRequired<
  DeepPartial<PremiumCalcData>,
  'MGACommission' | 'MGACommissionPct' | 'annualPremium' | 'techPremium'
>; // reporting --> require:  floodCategoryPremium | techPremium ??

export interface RatingData {
  submissionId: string | null;
  locationId?: string | null;
  externalId?: string | null;
  limits: Limits;
  TIV: number;
  deductible: number;
  RCVs: RCVs | null;
  ratingPropertyData: Nullable<RatingPropertyData>;
  premiumCalcData: RatingPremCalcData;
  AALs: Nullable<ValueByRiskType>;
  PM?: ValueByRiskType;
  riskScore?: ValueByRiskType;
  stateMultipliers?: ValueByRiskType;
  secondaryFactorMults?: SecondaryFactorMults;
  address?: Address | null;
  coordinates: GeoPoint | null;
  elevationData?: ElevationResult | null;
  metadata: BaseMetadata;
}

export interface ElevationResult {
  elevation: number;
  lat: number;
  lon: number;
  data_source: string;
  resolution: number;
}
