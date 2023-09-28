import { customAlphabet } from 'nanoid';

import { DocumentReference } from 'firebase-admin/firestore';
import {
  Address,
  ILocation,
  LcnWithTermPrem,
  PolicyLcnWithPrem,
  PolicyLocation,
} from '../../common/index.js';
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

export const partialLcnToPolicyLcn = (lcn: LcnWithTermPrem): PolicyLcnWithPrem => {
  let policyLcn: PolicyLcnWithPrem = {
    termPremium: lcn.termPremium,
  };
  if (lcn.address) policyLcn['address'] = compressAddress(lcn.address as Address);
  if (lcn.coordinates) policyLcn['coords'] = lcn.coordinates;
  if (lcn.cancelEffDate) policyLcn['cancelEffDate'] = lcn.cancelEffDate;
  if (lcn.metadata?.version) policyLcn['version'] = lcn.metadata?.version;

  return policyLcn;
};

/**
 * Check if a transaction already exists in database
 * @param {DocumentReference} docRef doc ref of transaction
 * @returns {boolean} returns boolean indicated if transaction exists for provided ref
 */
export const docExists = (docRef: DocumentReference) => {
  return docRef.get().then((snap) => snap.exists);
};
