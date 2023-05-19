import { Functions, httpsCallable } from 'firebase/functions';

export interface MoveUserToTenantRequest {
  userId: string;
  toTenantId?: string | null;
  fromTenantId?: string | null;
  // customClaims?: Record<string, any>
}
// TODO: prompt for claims. update cloud function to set claims
export interface MoveUserToTenantResponse {
  status: string;
  userId: string;
  fromTenantId: string | null;
  toTenantId: string | null;
}

export const moveUserToTenant = (functions: Functions, args: MoveUserToTenantRequest) =>
  httpsCallable<MoveUserToTenantRequest, MoveUserToTenantResponse>(
    functions,
    'moveusertotenant'
  )(args);
