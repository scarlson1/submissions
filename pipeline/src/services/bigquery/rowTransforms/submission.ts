import type { Submission } from '@idemand/common';
import {
  n,
  systemFields,
  transformAddress,
  transformAgency,
  transformAgent,
  transformLimits,
  transformRatingPropertyData,
  type AddressRow,
  type AgencyRow,
  type AgentRow,
  type LimitsRow,
  type RatingPropertyDataRow,
  type SystemFields,
} from '../transforms.js';

export interface SubmissionBQRow extends SystemFields {
  product: string | null;
  status: string | null;
  user_id: string | null;
  submitted_by_id: string | null;
  deductible: number | null;
  annual_premium: number | null;
  geo_hash: string | null;
  latitude: number | null;
  longitude: number | null;
  comm_source: string | null;
  address: AddressRow | null;
  limits: LimitsRow | null;
  rating_property_data: RatingPropertyDataRow | null;
  agent: AgentRow | null;
  agency: AgencyRow | null;
}

export function submissionToRow(
  id: string,
  data: Submission,
  deleted = false,
): SubmissionBQRow {
  return {
    ...systemFields(id, data.metadata?.version, deleted),
    product: n(data.product),
    status: n(data.status),
    user_id: n(data.userId),
    submitted_by_id: n(data.submittedById),
    deductible: n(data.deductible),
    annual_premium: n(data.annualPremium),
    geo_hash: n(data.geoHash),
    latitude: data.coordinates?.latitude ?? null,
    longitude: data.coordinates?.longitude ?? null,
    comm_source: n(data.commSource),
    address: transformAddress(data.address),
    limits: transformLimits(data.limits),
    rating_property_data: transformRatingPropertyData(data.ratingPropertyData),
    agent: transformAgent(data.agent),
    agency: transformAgency(data.agency),
  };
}
