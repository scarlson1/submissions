import { Functions, httpsCallable } from 'firebase/functions';

import { PolicyChangeRequest } from 'common';

export interface CalcPolicyChangesRequest {
  requestId: string;
  policyId: string;
}
export type CalcPolicyChangesResponse = Pick<
  PolicyChangeRequest,
  'policyChanges'
>;

export const calcPolicyChanges = (
  functions: Functions,
  args: CalcPolicyChangesRequest,
) =>
  httpsCallable<CalcPolicyChangesRequest, CalcPolicyChangesResponse>(
    functions,
    'call-calcpolicychanges',
  )(args);
