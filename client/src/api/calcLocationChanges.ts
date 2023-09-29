import { Functions, httpsCallable } from 'firebase/functions';

import { LocationChangeRequest } from 'common';

export interface CalcLocationChangesRequest {
  changeRequestId: string;
  policyId: string;
}
export type CalcLocationChangesResponse = Pick<LocationChangeRequest, 'locationChanges'>;

export const calcLocationChanges = (functions: Functions, args: CalcLocationChangesRequest) =>
  httpsCallable<CalcLocationChangesRequest, CalcLocationChangesResponse>(
    functions,
    'calclocationchanges'
  )(args);
