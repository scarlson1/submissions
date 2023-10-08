import { Functions, httpsCallable } from 'firebase/functions';

import { LocationChangeRequest } from 'common';

export interface CalcCancellationChangeRequest {
  requestId: string;
  policyId: string;
}
export type CalcCancellationChangeResponse = Pick<LocationChangeRequest, 'locationChanges'>;

export const calcCancelChange = (functions: Functions, args: CalcCancellationChangeRequest) =>
  httpsCallable<CalcCancellationChangeRequest, CalcCancellationChangeResponse>(
    functions,
    'calccancelchange'
  )(args);
