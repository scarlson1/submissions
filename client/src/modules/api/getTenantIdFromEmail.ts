import { Functions, httpsCallable } from 'firebase/functions';

export interface GetTenantRequest {
  email: string;
}
export interface GetTenantResponse {
  tenantId: string;
}

export const getTenantIdFromEmail = (functions: Functions, args: GetTenantRequest) =>
  httpsCallable<GetTenantRequest, GetTenantResponse>(functions, 'getTenantIdFromEmail')(args);
