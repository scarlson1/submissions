import type { Claim } from '@idemand/common';
import { Functions, httpsCallable } from 'firebase/functions';

export interface NewUser {
  email: string;
  name: string;
  access: Claim | '';
}

export interface InviteUsersRequest {
  users: NewUser[];
  tenantId?: string | null;
  orgId?: string | null;
}
export interface InviteUsersResponse {
  [email: string]: {
    status: string;
    inviteId: string;
    inviteRef: string;
    email: string;
    recipientName: string; // eslint-disable-next-line
    customClaims: { [key: string]: any };
  };
}

export const inviteUsers = (functions: Functions, args: InviteUsersRequest) =>
  httpsCallable<InviteUsersRequest, InviteUsersResponse>(
    functions,
    'call-inviteusers',
  )(args);
