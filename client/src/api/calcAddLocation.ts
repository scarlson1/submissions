import { DraftAddLocationRequest } from 'common';
import { Functions, httpsCallable } from 'firebase/functions';

export interface CalcAddLocationRequest {
  policyId: string;
  requestId: string;
}

export type CalcAddLocationResponse = Pick<
  DraftAddLocationRequest,
  'locationId' | 'locationChanges' | 'policyChanges' | 'formValues'
>;

export const calcAddLocation = (functions: Functions, args: CalcAddLocationRequest) =>
  httpsCallable<CalcAddLocationRequest, CalcAddLocationResponse>(
    functions,
    'calcaddlocation'
  )(args);
