import { customAlphabet } from 'nanoid';

import { ILocation, PolicyLocation } from '../../common/index.js';
import { compressAddress } from '../../utils/index.js';

export const locationToPolicyLocation = (location: ILocation): PolicyLocation => {
  let lcn: PolicyLocation = {
    coords: location.coordinates,
    address: compressAddress(location.address),
    termPremium: location.termPremium,
  };

  if (location?.cancelEffDate) lcn['cancelEffDate'] = location.cancelEffDate;
  if (location?.metadata?.version) lcn['version'] = location.metadata.version;

  return lcn;
};

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const nanoId = customAlphabet(ALPHABET, 9);

export const createDocId = nanoId;
