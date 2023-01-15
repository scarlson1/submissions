import { getFunctions, httpsCallable } from 'firebase/functions';

import { Address, Coordinates, Location } from 'common/types';

export type FetchPropertyDataRequest = Address | Coordinates | Location;
// export interface FetchPropertyDataResponse {}

const functions = getFunctions();

export const fetchPropertyDetails = httpsCallable<
  FetchPropertyDataRequest,
  any
  // FetchPropertyDataResponse
>(functions, 'getPropertyDetails');
