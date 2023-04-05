import { Functions, httpsCallable } from 'firebase/functions';
import { CUSTOM_CLAIMS } from 'modules/components';

export interface NewUser {
  email: string;
  name: string;
  access: CUSTOM_CLAIMS | '';
}

export interface InviteUsersRequest {
  users: NewUser[];
  tenantId?: string | null;
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
  httpsCallable<InviteUsersRequest, InviteUsersResponse>(functions, 'inviteUsers')(args);
