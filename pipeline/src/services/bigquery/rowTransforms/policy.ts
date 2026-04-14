import type { ILocationPolicy, Policy } from '@idemand/common';
import {
  n,
  systemFields,
  toTimestamp,
  transformAddress,
  transformAgency,
  transformAgent,
  transformFees,
  transformLimits,
  transformRatingPropertyData,
  transformRcvs,
  transformTaxItems,
  type AddressRow,
  type AgencyRow,
  type AgentRow,
  type FeeItemRow,
  type LimitsRow,
  type RatingPropertyDataRow,
  type RCVsRow,
  type SystemFields,
  type TaxItemRow,
} from '../transforms.js';

interface NamedInsuredRow {
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  user_id: string | null;
  org_id: string | null;
}

export interface PolicyBQRow extends SystemFields {
  product: string | null;
  payment_status: string | null;
  term: number | null;
  home_state: string | null;
  term_premium: number | null;
  term_premium_with_cancels: number | null;
  in_state_premium: number | null;
  out_state_premium: number | null;
  term_days: number | null;
  price: number | null;
  effective_date: string | null;
  expiration_date: string | null;
  cancel_eff_date: string | null;
  cancel_reason: string | null;
  user_id: string | null;
  quote_id: string | null;
  external_id: string | null;
  issuing_carrier: string | null;
  comm_source: string | null;
  named_insured: NamedInsuredRow | null;
  mailing_address: (AddressRow & { name: string | null }) | null;
  agent: AgentRow | null;
  agency: AgencyRow | null;
  fees: FeeItemRow[];
  taxes: TaxItemRow[];
}

export interface PolicyLocationBQRow extends SystemFields {
  location_id: string;
  policy_id: string | null;
  quote_id: string | null;
  submission_id: string | null;
  parent_type: string | null;
  external_id: string | null;
  latitude: number | null;
  longitude: number | null;
  geo_hash: string | null;
  address: AddressRow | null;
  annual_premium: number | null;
  term_premium: number | null;
  term_days: number | null;
  tiv: number | null;
  deductible: number | null;
  limits: LimitsRow | null;
  rcvs: RCVsRow | null;
  rating_property_data: RatingPropertyDataRow | null;
  effective_date: string | null;
  expiration_date: string | null;
  cancel_eff_date: string | null;
  cancel_reason: string | null;
}

export function policyToRow(
  id: string,
  data: Policy,
  deleted = false,
): PolicyBQRow {
  const ni = data.namedInsured;
  const ma = data.mailingAddress;
  return {
    ...systemFields(id, data.metadata?.version, deleted),
    product: n(data.product),
    payment_status: n(data.paymentStatus),
    term: n(data.term),
    home_state: n(data.homeState),
    term_premium: n(data.termPremium),
    term_premium_with_cancels: n(data.termPremiumWithCancels),
    in_state_premium: n(data.inStatePremium),
    out_state_premium: n(data.outStatePremium),
    term_days: n(data.termDays),
    price: n(data.price),
    effective_date: toTimestamp(data.effectiveDate),
    expiration_date: toTimestamp(data.expirationDate),
    cancel_eff_date: toTimestamp(data.cancelEffDate),
    cancel_reason: n(data.cancelReason),
    user_id: n(data.userId),
    quote_id: n(data.quoteId),
    external_id: n(data.externalId),
    issuing_carrier: n(data.issuingCarrier),
    comm_source: n(data.commSource),
    named_insured: ni
      ? {
          display_name: n(ni.displayName),
          first_name: n(ni.firstName),
          last_name: n(ni.lastName),
          email: n(ni.email),
          phone: n(ni.phone),
          user_id: n(ni.userId),
          org_id: n(ni.orgId),
        }
      : null,
    mailing_address: ma
      ? { ...transformAddress(ma)!, name: n(ma.name) }
      : null,
    agent: transformAgent(data.agent),
    agency: transformAgency(data.agency),
    fees: transformFees(data.fees),
    taxes: transformTaxItems(data.taxes),
  };
}

export function policyLocationToRow(
  _policyId: string,
  lcnId: string,
  data: ILocationPolicy,
  deleted = false,
): PolicyLocationBQRow {
  return {
    ...systemFields(lcnId, data.metadata?.version, deleted),
    location_id: lcnId,
    policy_id: n(data.policyId),
    quote_id: n(data.quoteId),
    submission_id: n(data.submissionId),
    parent_type: n(data.parentType),
    external_id: n(data.externalId),
    latitude: data.coordinates?.latitude ?? null,
    longitude: data.coordinates?.longitude ?? null,
    geo_hash: n(data.geoHash),
    address: transformAddress(data.address),
    annual_premium: n(data.annualPremium),
    term_premium: n(data.termPremium),
    term_days: n(data.termDays),
    tiv: n(data.TIV),
    deductible: n(data.deductible),
    limits: transformLimits(data.limits),
    rcvs: transformRcvs(data.RCVs),
    rating_property_data: transformRatingPropertyData(data.ratingPropertyData),
    effective_date: toTimestamp(data.effectiveDate),
    expiration_date: toTimestamp(data.expirationDate),
    cancel_eff_date: toTimestamp(data.cancelEffDate),
    cancel_reason: n(data.cancelReason),
  };
}
