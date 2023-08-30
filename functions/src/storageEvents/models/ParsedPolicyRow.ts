import { GeoPoint } from 'firebase-admin/firestore';
import {
  AdditionalInsured,
  Address,
  AgencyDetails,
  AgentDetails,
  FeeItem,
  Limits,
  Mortgagee,
  NamedInsured,
  Nullable,
  RCVs,
  RatingPropertyData,
  SLProdOfRecordDetails,
  TaxItem,
  ValueByRiskType,
} from '../../common';

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
  externalId: string;
  additionalInsured: AdditionalInsured[];
  mortgageeInterest: Mortgagee[];
  term: number | null;
  ratingPropertyData: RatingPropertyData;
  ratingDocId?: string;
  product: string;
  mgaCommissionPct: number | null;
  AALs: Nullable<ValueByRiskType>;
  // TODO: other required rating data (from Ron)
}
