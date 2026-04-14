import type { Transaction } from '@idemand/common';
import {
  n,
  systemFields,
  toTimestamp,
  transformAgency,
  transformAgent,
  transformLimits,
  transformRatingPropertyData,
  transformRcvs,
  type AgencyRow,
  type AgentRow,
  type LimitsRow,
  type RatingPropertyDataRow,
  type RCVsRow,
  type SystemFields,
} from '../transforms.js';

interface TransactionRatingPropertyDataRow extends RatingPropertyDataRow {
  tier1: boolean | null;
  construction: string | null;
}

export interface TransactionBQRow extends SystemFields {
  trx_type: string | null;
  trx_interface_type: string | null;
  product: string | null;
  policy_id: string | null;
  location_id: string | null;
  external_id: string | null;
  term: number | null;
  booking_date: string | null;
  issuing_carrier: string | null;
  named_insured: string | null;
  home_state: string | null;
  policy_eff_date: string | null;
  policy_exp_date: string | null;
  trx_eff_date: string | null;
  trx_exp_date: string | null;
  trx_days: number | null;
  agent: AgentRow | null;
  agency: AgencyRow | null;
  // PremiumTransaction / OffsetTransaction fields (null on AmendmentTransaction)
  term_premium: number | null;
  mga_commission: number | null;
  mga_commission_pct: number | null;
  net_dwp: number | null;
  daily_premium: number | null;
  net_error_adj: number | null;
  surplus_lines_tax: number | null;
  surplus_lines_regulatory_fee: number | null;
  mga_fee: number | null;
  inspection_fee: number | null;
  cancel_reason: string | null;
  // PremiumTransaction-only fields
  tiv: number | null;
  deductible: number | null;
  location_annual_premium: number | null;
  term_prorated_pct: number | null;
  billing_entity_id: string | null;
  limits: LimitsRow | null;
  rcvs: RCVsRow | null;
  rating_property_data: TransactionRatingPropertyDataRow | null;
}

export function transactionToRow(
  id: string,
  data: Transaction,
  deleted = false,
): TransactionBQRow {
  const isPremium = data.trxInterfaceType === 'premium';
  const isOffset = data.trxInterfaceType === 'offset';

  return {
    ...systemFields(id, data.metadata?.version, deleted),
    trx_type: n(data.trxType),
    trx_interface_type: n(data.trxInterfaceType),
    product: n(data.product),
    policy_id: n(data.policyId),
    location_id: n(data.locationId),
    external_id: n(data.externalId),
    term: n(data.term),
    booking_date: toTimestamp(data.bookingDate),
    issuing_carrier: n(data.issuingCarrier),
    named_insured: n(data.namedInsured),
    home_state: n(data.homeState),
    policy_eff_date: toTimestamp(data.policyEffDate),
    policy_exp_date: toTimestamp(data.policyExpDate),
    trx_eff_date: toTimestamp(data.trxEffDate),
    trx_exp_date: toTimestamp(data.trxExpDate),
    trx_days: n(data.trxDays),
    agent: transformAgent(data.agent),
    agency: transformAgency(data.agency),
    term_premium: isPremium || isOffset ? n(data.termPremium) : null,
    mga_commission: isPremium || isOffset ? n(data.MGACommission) : null,
    mga_commission_pct: isPremium || isOffset ? n(data.MGACommissionPct) : null,
    net_dwp: isPremium || isOffset ? n(data.netDWP) : null,
    daily_premium: isPremium || isOffset ? n(data.dailyPremium) : null,
    net_error_adj: isPremium || isOffset ? n(data.netErrorAdj) : null,
    surplus_lines_tax: isPremium || isOffset ? n(data.surplusLinesTax) : null,
    surplus_lines_regulatory_fee:
      isPremium || isOffset ? n(data.surplusLinesRegulatoryFee) : null,
    mga_fee: isPremium || isOffset ? n(data.MGAFee) : null,
    inspection_fee: isPremium || isOffset ? n(data.inspectionFee) : null,
    cancel_reason: isOffset ? n(data.cancelReason) : null,
    tiv: isPremium ? n(data.TIV) : null,
    deductible: isPremium ? n(data.deductible) : null,
    location_annual_premium: isPremium ? n(data.locationAnnualPremium) : null,
    term_prorated_pct: isPremium ? n(data.termProratedPct) : null,
    billing_entity_id: isPremium ? n(data.billingEntityId) : null,
    limits: isPremium ? transformLimits(data.limits) : null,
    rcvs: isPremium ? transformRcvs(data.RCVs) : null,
    rating_property_data: isPremium
      ? {
          ...transformRatingPropertyData(data.ratingPropertyData)!,
          tier1: n(data.ratingPropertyData?.tier1),
          construction: n(data.ratingPropertyData?.construction),
        }
      : null,
  };
}
