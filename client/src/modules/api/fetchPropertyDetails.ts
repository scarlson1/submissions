import { Functions, httpsCallable } from 'firebase/functions';

import { Address, Coordinates, Location, Nullable, RatingPropertyData } from 'common/types';

export type FetchPropertyDataRequest = Address | Coordinates | Location;
export interface FetchPropertyDataResponse extends Nullable<RatingPropertyData> {
  initDeductible: number;
  initLimitA: number;
  initLimitB: number;
  initLimitC: number;
  initLimitD: number;
  maxDeductible: number;
  spatialKeyDocId?: string | null;
  attomDocId?: string | null;
}

export const fetchPropertyDetails = (functions: Functions) =>
  httpsCallable<FetchPropertyDataRequest, FetchPropertyDataResponse>(
    functions,
    'getpropertydetails'
  );
