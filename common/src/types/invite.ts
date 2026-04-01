import { z } from 'zod';
import { BaseMetadata } from './common.js';

export const InviteStatus = z.enum([
  'pending',
  'accepted',
  'revoked',
  'replaced',
  'rejected',
  'expired',
  'error',
]);
export type InviteStatus = z.infer<typeof InviteStatus>;

export const Invite = z.object({
  email: z.string().email(),
  displayName: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  link: z.string().url().optional(),
  customClaims: z.record(z.any()),
  orgId: z.string().nullable(),
  orgName: z.string(),
  status: InviteStatus,
  sent: z.boolean().optional(),
  isCreateOrgInvite: z.boolean().optional(),
  id: z.string(),
  invitedBy: z
    .object({
      userId: z.string().optional(),
      name: z.string().optional(), // use displayName ??,
      email: z.string(),
    })
    .optional()
    .nullable(),
  metadata: BaseMetadata,
});
export type Invite = z.infer<typeof Invite>;

export interface InviteClassInterface extends Invite {
  getLink: () => string;
  hostingUrl: string;
  mgaOrgId: string;
}

export class InviteClass implements InviteClassInterface {
  public email: string;
  public displayName?: string;
  public firstName?: string;
  public lastName?: string;
  public link?: string;
  public customClaims: Record<string, any>;
  public orgId: string | null;
  public orgName: string;
  public status: InviteStatus;
  public sent: boolean;
  public isCreateOrgInvite?: boolean;
  public id: string;
  public invitedBy?: {
    userId?: string;
    name?: string;
    email: string;
  } | null;
  public metadata: BaseMetadata;

  public hostingUrl: string;
  public mgaOrgId: string;

  constructor(inviteInfo: Invite, hostingUrl: string, mgaOrgId: string) {
    this.email = inviteInfo.email;
    this.displayName = inviteInfo.displayName;
    this.firstName = inviteInfo.firstName;
    this.lastName = inviteInfo.lastName;
    this.link = inviteInfo.link;
    this.customClaims = inviteInfo.customClaims;
    this.orgId = inviteInfo.orgId;
    this.orgName = inviteInfo.orgName;
    this.status = inviteInfo.status;
    this.sent = inviteInfo.sent || false;
    this.isCreateOrgInvite = !!inviteInfo.isCreateOrgInvite;
    this.id = inviteInfo.id;
    this.invitedBy = inviteInfo.invitedBy;
    this.metadata = inviteInfo.metadata;

    ((this.hostingUrl = hostingUrl), (this.mgaOrgId = mgaOrgId));
  }

  getLink() {
    let tenantURL = this.orgId === this.mgaOrgId ? '' : `/${this.orgId}`;

    return `${this.hostingUrl}/auth/create-account${tenantURL}?email=${encodeURIComponent(
      this.email,
    )}&firstName=${encodeURIComponent(this.firstName ?? '')}&lastName=${encodeURIComponent(
      this.lastName ?? '',
    )}`;
  }
}
