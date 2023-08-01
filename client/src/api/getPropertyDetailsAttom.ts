import { Functions, httpsCallable } from 'firebase/functions';

import { Address, Coordinates, Nullable, RatingPropertyData } from 'common/types';

export interface GetPropertyDetailsAttomRequest extends Omit<Address, 'addressLine2'> {
  coordinates?: Nullable<Coordinates> | null | undefined;
}
export interface GetPropertyDetailsAttomResponse extends Nullable<RatingPropertyData> {
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
    'getpropertydetailsattom'
  );
