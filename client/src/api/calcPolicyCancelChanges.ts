import { Functions, httpsCallable } from 'firebase/functions';

import { CancellationRequest } from 'common';

export interface CalcPolicyCancelChangesRequest {
  requestId: string;
  policyId: string;
}
export type CalcPolicyCancelChangesResponse = Pick<
  CancellationRequest,
  'policyChanges' | 'formValues'
>;

export const calcPolicyCancelChanges = (
  functions: Functions,
  args: CalcPolicyCancelChangesRequest
) =>
  httpsCallable<CalcPolicyCancelChangesRequest, CalcPolicyCancelChangesResponse>(
    functions,
    'calcpolicycancelchanges'
  )(args);
