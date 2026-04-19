import z from 'zod';
import { DefaultCommission } from '../enums.js';
import {
  Address,
  AgencyDetails,
  AgentDetails,
  BaseMetadata,
  GeoPoint,
} from './common.js';

const User = z.object({
  displayName: z.string().optional(),
  email: z.string().nullable(),
  phone: z.string().optional(),
  photoURL: z.string().optional(),
  // stripe_customer_id?: z.string(); // TODO: currently set as billingEntity.stripeCustomerId. necessary ?? fetched by email for billingEntity to ensure user exists. Setting on user doc from webhook
  stripeCustomerId: z.string().optional().nullable(),
  tenantId: z.string().optional().nullable(), // useOrgId ?
  orgId: z.string().optional().nullable(),
  orgName: z.string().optional().nullable(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  initialAnonymous: z.boolean().optional(),
  defaultCommission: DefaultCommission.optional(), // TODO: extends user to create Agent type ?? or store settings in subcollection ??
  address: Address.optional(),
  coordinates: GeoPoint.optional().nullable(),
  metadata: BaseMetadata,
});
export type User = z.infer<typeof User>;

export const UserAccess = z.object({
  userId: z.string(),
  orgIds: z.array(z.string()),
  agentIds: z.array(z.string()),
  orgs: z.record(z.string(), AgencyDetails),
  agents: z.record(z.string(), AgentDetails),
  metadata: BaseMetadata,
});
export type UserAccess = z.infer<typeof UserAccess>;

// export interface User {
//   displayName?: string;
//   email?: string | null;
//   phone?: string;
//   photoURL?: string;
//   // stripe_customer_id?: string; // TODO: currently set as billingEntity.stripeCustomerId. necessary ?? fetched by email for billingEntity to ensure user exists. Setting on user doc from webhook
//   stripeCustomerId?: string;
//   tenantId?: string | null; // useOrgId ??
//   orgId?: string | null;
//   orgName?: string | null;
//   firstName?: string;
//   lastName?: string;
//   initialAnonymous?: boolean;
//   defaultCommission?: DefaultCommission; // TODO: extends user to create Agent type ?? or store settings in subcollection ??
//   address?: Address;
//   coordinates?: GeoPoint | null;
//   metadata: BaseMetadata;
// }

// export interface UserAccess {
//   userId: string;
//   orgIds: string[];
//   agentIds: string[];
//   orgs: Record<string, AgencyDetails>;
//   agents: Record<string, AgentDetails>;
//   metadata: BaseMetadata;
// }
