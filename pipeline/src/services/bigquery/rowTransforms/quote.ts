import type { AgencyDetails, AgentDetails, Quote } from '@idemand/common';
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
  transformTaxItems,
  type AddressRow,
  type AgencyRow,
  type AgentRow,
  type FeeItemRow,
  type LimitsRow,
  type RatingPropertyDataRow,
  type SystemFields,
  type TaxItemRow,
} from '../transforms.js';

interface QuoteNamedInsuredRow {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  user_id: string | null;
}

export interface QuoteBQRow extends SystemFields {
  policy_id: string | null;
  product: string | null;
  status: string | null;
  home_state: string | null;
  submission_id: string | null;
  external_id: string | null;
  user_id: string | null;
  deductible: number | null;
  annual_premium: number | null;
  quote_total: number | null;
  card_fee: number | null;
  latitude: number | null;
  longitude: number | null;
  geo_hash: string | null;
  comm_source: string | null;
  rating_doc_id: string | null;
  effective_date: string | null;
  quote_published_date: string | null;
  quote_expiration_date: string | null;
  quote_bound_date: string | null;
  address: AddressRow | null;
  limits: LimitsRow | null;
  rating_property_data: RatingPropertyDataRow | null;
  named_insured: QuoteNamedInsuredRow | null;
  agent: AgentRow | null;
  agency: AgencyRow | null;
  fees: FeeItemRow[];
  taxes: TaxItemRow[];
}

export function quoteToRow(
  id: string,
  data: Quote,
  deleted = false,
): QuoteBQRow {
  const ni = data.namedInsured;
  return {
    ...systemFields(id, data.metadata?.version, deleted),
    policy_id: n(data.policyId),
    product: n(data.product),
    status: n(data.status),
    home_state: n(data.homeState),
    submission_id: n(data.submissionId),
    external_id: n(data.externalId),
    user_id: n(data.userId),
    deductible: n(data.deductible),
    annual_premium: n(data.annualPremium),
    quote_total: n(data.quoteTotal),
    card_fee: n(data.cardFee),
    latitude: data.coordinates?.latitude ?? null,
    longitude: data.coordinates?.longitude ?? null,
    geo_hash: n(data.geoHash),
    comm_source: n(data.commSource),
    rating_doc_id: n(data.ratingDocId),
    effective_date: toTimestamp(data.effectiveDate),
    quote_published_date: toTimestamp(data.quotePublishedDate),
    quote_expiration_date: toTimestamp(data.quoteExpirationDate),
    quote_bound_date: toTimestamp(data.quoteBoundDate),
    address: transformAddress(data.address),
    limits: transformLimits(data.limits),
    rating_property_data: transformRatingPropertyData(data.ratingPropertyData),
    named_insured: ni
      ? {
          first_name: n(ni.firstName),
          last_name: n(ni.lastName),
          email: n(ni.email),
          phone: n(ni.phone),
          user_id: n(ni.userId),
        }
      : null,
    agent: transformAgent(data.agent as AgentDetails),
    agency: transformAgency(data.agency as AgencyDetails),
    fees: transformFees(data.fees),
    taxes: transformTaxItems(data.taxes),
  };
}
