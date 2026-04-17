import { Functions, httpsCallable } from 'firebase/functions';

import type {
  Address,
  Coords,
  Nullable,
  RatingPropertyData,
} from '@idemand/common';
import { ElevationResult } from 'common/types';

export interface GetPropertyDetailsAttomRequest extends Omit<
  Address,
  'addressLine2'
> {
  coordinates?: Nullable<Coords> | null | undefined;
}
export interface GetPropertyDetailsAttomResponse extends Nullable<RatingPropertyData> {
  initDeductible: number;
  initLimitA: number;
  initLimitB: number;
  initLimitC: number;
  initLimitD: number;
  maxDeductible: number;
  attomDocId?: string | null;
  coordinates: Nullable<Coords>;
  elevationData: ElevationResult | null;
}

export const getPropertyDetailsAttom = (functions: Functions) =>
  httpsCallable<
    GetPropertyDetailsAttomRequest,
    GetPropertyDetailsAttomResponse
  >(functions, 'call-getpropertydetailsattom');
