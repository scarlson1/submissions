import { httpsCallable } from 'firebase/functions';

import { Address, Coordinates, Location, RatingPropertyData } from 'common/types';
import { functions } from 'firebaseConfig';

export type FetchPropertyDataRequest = Address | Coordinates | Location;
export interface FetchPropertyDataResponse extends RatingPropertyData {
  initDeductible: number;
  initLimitA: number;
  initLimitB: number;
  initLimitC: number;
  initLimitD: number;
  maxDeductible: number;
  spatialKeyDocId?: string | null;
}

export const fetchPropertyDetails = httpsCallable<
  FetchPropertyDataRequest,
  FetchPropertyDataResponse
>(functions, 'getPropertyDetails');
