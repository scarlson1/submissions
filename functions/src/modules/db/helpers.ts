import { customAlphabet } from 'nanoid';

import { ILocation, PolicyLocation } from '../../common';
import { compressAddress } from '../../utils';

export const locationToPolicyLocation = (location: ILocation): PolicyLocation => ({
  coords: location.coordinates,
  address: compressAddress(location.address),
  termPremium: location.termPremium,
});

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const nanoId = customAlphabet(ALPHABET, 8);

export const createDocId = nanoId;
