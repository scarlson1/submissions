import { Functions, httpsCallable } from 'firebase/functions';

import { Address, RatingPropertyData } from 'common/types';

export interface GetPropertyDetailsAttomRequest extends Omit<Address, 'addressLine2'> {}
export interface GetPropertyDetailsAttomResponse extends RatingPropertyData {
  initDeductible: number;
  initLimitA: number;
  initLimitB: number;
  initLimitC: number;
  initLimitD: number;
  maxDeductible: number;
  attomDocId?: string | null;
}

export const getPropertyDetailsAttom = (functions: Functions) =>
  httpsCallable<GetPropertyDetailsAttomRequest, GetPropertyDetailsAttomResponse>(
    functions,
    'getPropertyDetailsAttom'
  );
