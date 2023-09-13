import { round, sumBy } from 'lodash';
import { customAlphabet } from 'nanoid';

import { ILocation, PolicyLocation, PolicyNew } from '../../common';
import { compressAddress } from '../../utils';

export const locationToPolicyLocation = (location: ILocation): PolicyLocation => ({
  coords: location.coordinates,
  address: compressAddress(location.address),
  termPremium: location.termPremium,
  // lcnDocId: location.locationId,
});

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const nanoId = customAlphabet(ALPHABET, 9);

export const createDocId = nanoId;

export function getPolicyTermPremium(
  locations: PolicyNew['locations'] | Record<string, ILocation>
) {
  return round(
    sumBy(Object.values(locations), (l) => l.termPremium),
    2
  );
}
