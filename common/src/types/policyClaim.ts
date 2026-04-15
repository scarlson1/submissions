import z from 'zod';
import { PolicyClaimStatus } from '../enums.js';
import {
  Address,
  AgencyDetails,
  AgentDetails,
  BaseMetadata,
  GeoPoint,
  Limits,
  Phone,
  Timestamp,
} from './common.js';
import { ILocationPolicy } from './location.js';
import { NamedInsured, Policy } from './policy.js';

// TODO: extend contact from new submission / agency, etc. forms
export const ContactZ = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: Phone,
});

export const PreferredMethodEnum = z.enum(['email', 'phone']);
export type PreferredMethod = z.infer<typeof PreferredMethodEnum>;

export const ClaimContactZ = ContactZ.and(
  z.object({
    preferredMethod: PreferredMethodEnum,
    entityType: z.enum(['namedInsured', 'agent', 'other']),
  }),
);
export type ClaimContact = z.infer<typeof ClaimContactZ>;

// TODO: create draft claim from policy claim
export const PolicyClaim = z.object({
  occurrenceDate: Timestamp,
  description: z.string().min(30),
  images: z.array(z.string()).max(10),
  contact: ClaimContactZ,
  status: PolicyClaimStatus, // z.string(), // TODO: status
  policyId: z.string(),
  locationId: z.string(),
  namedInsured: NamedInsured,
  agent: AgentDetails,
  agency: AgencyDetails,
  submittedAt: Timestamp,
  address: Address,
  coordinates: GeoPoint, // GeoPoint
  limits: Limits,
  locationData: ILocationPolicy,
  policyData: Policy,
  submittedBy: z.object({
    userId: z.string(),
    email: z.string().email().nullable(),
    orgId: z.string().nullable(),
  }),
  metadata: BaseMetadata,
});
export type PolicyClaim = z.infer<typeof PolicyClaim>;

export const ClaimFormValues = PolicyClaim.pick({
  occurrenceDate: true,
  description: true,
  images: true,
  contact: true,
});
export type ClaimFormValues = z.infer<typeof ClaimFormValues>;

const DraftPolicyClaim = ClaimFormValues.partial()
  .and(PolicyClaim.pick({ policyId: true, locationId: true, metadata: true }))
  .and(z.object({ status: z.literal('draft') }));
export type DraftPolicyClaim = z.infer<typeof DraftPolicyClaim>;
