import { DefaultCommission } from '../enums.js';
import { Address, AgencyDetails, AgentDetails, BaseMetadata, GeoPoint } from './common.js';

export interface User {
  displayName?: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  stripe_customer_id?: string;
  tenantId?: string | null; // useOrgId ??
  orgId?: string | null;
  orgName?: string | null;
  firstName?: string;
  lastName?: string;
  initialAnonymous?: boolean;
  defaultCommission?: DefaultCommission; // TODO: extends user to create Agent type ?? or store settings in subcollection ??
  address?: Address;
  coordinates?: GeoPoint | null;
  metadata: BaseMetadata;
}

export interface UserAccess {
  userId: string;
  orgIds: string[];
  agentIds: string[];
  orgs: Record<string, AgencyDetails>;
  agents: Record<string, AgentDetails>;
  metadata: BaseMetadata;
}
