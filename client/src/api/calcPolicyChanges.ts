import { Functions, httpsCallable } from 'firebase/functions';

import { LocationChangeRequest } from 'common';

export interface CalcPolicyChangesRequest {
  requestId: string;
  policyId: string;
}
export type CalcPolicyChangesResponse = Pick<LocationChangeRequest, 'policyChanges'>;

export const calcPolicyChanges = (functions: Functions, args: CalcPolicyChangesRequest) =>
  httpsCallable<CalcPolicyChangesRequest, CalcPolicyChangesResponse>(
    functions,
    'calcpolicychanges'
  )(args);
