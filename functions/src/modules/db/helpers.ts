import { ILocation, PolicyLocation } from '../../common';
import { compressAddress } from '../../utils';

export const locationToPolicyLocation = (location: ILocation): PolicyLocation => ({
  coords: location.coordinates,
  address: compressAddress(location.address),
  termPremium: location.termPremium,
});
