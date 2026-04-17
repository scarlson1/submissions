import type { LocationChangeRequest } from '@idemand/common';
import { Functions, httpsCallable } from 'firebase/functions';

export interface CalcCancellationChangeRequest {
  requestId: string;
  policyId: string;
}
export type CalcCancellationChangeResponse = Pick<
  LocationChangeRequest,
  'locationChanges'
>;

export const calcCancelChange = (
  functions: Functions,
  args: CalcCancellationChangeRequest,
) =>
  httpsCallable<CalcCancellationChangeRequest, CalcCancellationChangeResponse>(
    functions,
    'call-calccancelchange',
  )(args);
