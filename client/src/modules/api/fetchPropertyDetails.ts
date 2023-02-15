import { httpsCallable } from 'firebase/functions';

import { Address, Coordinates, Location } from 'common/types';
import { functions } from 'firebaseConfig';

export type FetchPropertyDataRequest = Address | Coordinates | Location;
export interface FetchPropertyDataResponse {
  CBRSDesignation: string;
  basement: string;
  initDeductible: number;
  distToCoastFeet: number;
  floodZone: string;
  initLimitA: number;
  initLimitB: number;
  initLimitC: number;
  initLimitD: number;
  maxDeductible: number;
  numStories: number;
  propertyCode: string;
  replacementCost: number;
  sqFootage: number;
  yearBuilt: number;
  spatialKeyDocId?: string | null;
}

// export const fetchPropertyDetails = (functions: Functions) =>
//   httpsCallable<FetchPropertyDataRequest, FetchPropertyDataResponse>(
//     functions,
//     'getPropertyDetails'
//   );

export const fetchPropertyDetails = httpsCallable<
  FetchPropertyDataRequest,
  FetchPropertyDataResponse
>(functions, 'getPropertyDetails');
