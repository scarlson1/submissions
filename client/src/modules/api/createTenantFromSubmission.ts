import { Functions, httpsCallable } from 'firebase/functions';

export interface CreateTenantRequest {
  docId: string;
}
export interface CreateTenantResponse {
  tenantId: string;
  displayName?: string;
  emailSignInConfig?: {
    enabled: boolean;
    passwordRequired: boolean;
  };
  multiFactorConfig?: {
    factorIds: any[];
    state: string;
  };
  anonymousSignInEnabled: boolean;
}

export const createTenantFromSubmission = (functions: Functions, args: CreateTenantRequest) =>
  httpsCallable<CreateTenantRequest, CreateTenantResponse>(
    functions,
    'createTenantFromSubmission'
  )(args);
