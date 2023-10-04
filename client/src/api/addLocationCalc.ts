import { DraftAddLocationRequest } from 'common';
import { Functions, httpsCallable } from 'firebase/functions';

export interface AddLocationCalcRequest {
  policyId: string;
  requestId: string;
}

export type AddLocationCalcResponse = Pick<
  DraftAddLocationRequest,
  'locationId' | 'locationChanges' | 'policyChanges' | 'formValues'
>;

export const addLocationCalc = (functions: Functions, args: AddLocationCalcRequest) =>
  httpsCallable<AddLocationCalcRequest, AddLocationCalcResponse>(
    functions,
    'addlocationcalc'
  )(args);
