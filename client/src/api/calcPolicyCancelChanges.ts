import type { CancellationRequest } from '@idemand/common';
import { Functions, httpsCallable } from 'firebase/functions';

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
  args: CalcPolicyCancelChangesRequest,
) =>
  httpsCallable<
    CalcPolicyCancelChangesRequest,
    CalcPolicyCancelChangesResponse
  >(
    functions,
    'call-calcpolicycancelchanges',
  )(args);
