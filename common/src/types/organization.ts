import { z } from 'zod';
import { DefaultCommission } from '../enums.js';
import {
  Address,
  AgentDetails,
  BaseMetadata,
  GeoPoint,
  Timestamp,
} from './common.js';

export const AuthProviders = z.enum([
  'password',
  'phone',
  'google.com',
  'microsoft.com',
  'apple.com',
  'twitter.com',
  'github.com',
  'yahoo.com',
  'hotmail.com',
]);
export type AuthProviders = z.infer<typeof AuthProviders>;

export const AgencyStatus = z.enum([
  'submitted',
  'active',
  'inactive',
  'pending_info',
]);
export type AgencyStatus = z.infer<typeof AgencyStatus>;

export const OrgType = z.enum(['agency', 'carrier']);
export type OrgType = z.infer<typeof OrgType>;

export const OrgFunnelAnalytics = z.object({
  lastUpdated: Timestamp,
  period: z.string(),
  submissionCount: z.number().int(),
  submissionToQuoteRate: z.number(),
  quoteToBind: z.number(),
  avgHoursToBind: z.number(),
  avgTermPremium: z.number(),
  cancellationRate: z.number(),
});

export const Organization = z.object({
  type: OrgType,
  address: Address.optional(),
  coordinates: GeoPoint.nullable().optional(),
  orgName: z.string().min(2, 'orgName must be at least 2 characters'),
  orgId: z.string().min(5, 'orgId must be at least 5 characters'),
  tenantId: z.string().nullable(),
  stripeAccountId: z.string().nullable(),
  primaryContact: AgentDetails.omit({ name: true })
    .extend({
      firstName: z.string(),
      lastName: z.string(),
      displayName: z.string(),
    })
    .optional(),
  principalProducer: AgentDetails.omit({ name: true })
    .extend({
      firstName: z.string(),
      lastName: z.string(),
      displayName: z.string(),
      NPN: z.string(),
    })
    .optional(),
  FEIN: z.string().optional(),
  EandOURL: z.string().optional(),
  // accountNumber: z.string(), // TODO: handle in stripe or separate collection
  // routingNumber: z.string(),
  emailDomains: z.array(z.string()).optional().nullable(),
  enforceDomainRestriction: z.boolean().optional(),
  status: AgencyStatus,
  defaultCommission: DefaultCommission,
  authProviders: z.array(AuthProviders),
  photoURL: z.string().optional().nullable(),
  website: z.string().url().optional().nullable(),
  analytics: z
    .object({
      funnel: OrgFunnelAnalytics.optional(),
    })
    .optional(),
  metadata: BaseMetadata,
});
export type Organization = z.infer<typeof Organization>;
