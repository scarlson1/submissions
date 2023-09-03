import { nanoid } from 'nanoid';

import { ILocation, PolicyLocation } from '../../common';
import { compressAddress } from '../../utils';

export const locationToPolicyLocation = (location: ILocation): PolicyLocation => ({
  coords: location.coordinates,
  address: compressAddress(location.address),
  termPremium: location.termPremium,
});

// TODO: take every-other character instead of cutting in half ??
// Using regex: https://stackoverflow.com/a/68158657
// const string = 'You s$eem t%o be =very [happy? thes+e day$s!';
// const saltedString = string.replace(/(.{5})./g, '$1');

/** generates a unique ID using uuid, removes hyphens, returns first half
 * @returns {string} new unique ID
 */
export function createDocId() {
  let nano = nanoid().replace(/[_-]/g, '');
  return nano.replace(/(.{1})./g, '$1'); // remove every other character
  // let id = uuid().replace(/-/g, '');
  // return id.substring(0, id.length / 2);
}
