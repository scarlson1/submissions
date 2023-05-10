import { Functions, httpsCallable } from 'firebase/functions';

export interface MoveUserToTenantRequest {
  userId: string;
  toTenantId?: string;
  fromTenantId?: string;
}
export interface MoveUserToTenantResponse {
  status: string;
}

export const moveUserToTenant = (functions: Functions, args: MoveUserToTenantRequest) =>
  httpsCallable<MoveUserToTenantRequest, MoveUserToTenantResponse>(
    functions,
    'moveusertotenant'
  )(args);
