import type { LocationChangeRequest } from '@idemand/common';
import { Functions, httpsCallable } from 'firebase/functions';

export interface CalcLocationChangesRequest {
  requestId: string;
  policyId: string;
}
export type CalcLocationChangesResponse = Pick<
  LocationChangeRequest,
  'locationChanges'
>;

export const calcLocationChanges = (
  functions: Functions,
  args: CalcLocationChangesRequest,
) =>
  httpsCallable<CalcLocationChangesRequest, CalcLocationChangesResponse>(
    functions,
    'call-calclocationchanges',
  )(args);
