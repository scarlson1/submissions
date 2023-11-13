import { AdditionalInterest, Mortgagee } from '@idemand/common';
import {
  AdditionalInsured,
  // AdditionalInterest,
  Address,
  AddressWithCoords,
  ILocation,
  LcnWithTermPrem,
  // Mortgagee,
  PolicyLcnWithPrem,
  PolicyLocation,
} from '../common/index.js';
import { compressAddress } from './helpers.js';

// Location <--> Policy Location

export const locationToPolicyLocation = (
  location: ILocation,
  billingEntityId: string
): PolicyLocation => {
  let lcn: PolicyLocation = {
    coords: location.coordinates,
    address: compressAddress(location.address),
    termPremium: location.termPremium,
    annualPremium: location.annualPremium,
    billingEntityId,
  };

  if (location?.cancelEffDate) lcn['cancelEffDate'] = location.cancelEffDate;
  if (location?.metadata?.version) lcn['version'] = location.metadata.version;

  return lcn;
};

// TODO: need to check if needs to require billing entity ID (check all instances where fn is used)
export const partialLcnToPolicyLcn = (lcn: LcnWithTermPrem): PolicyLcnWithPrem => {
  let policyLcn: PolicyLcnWithPrem = {
    termPremium: lcn.termPremium,
    annualPremium: lcn.annualPremium,
  };
  if (lcn.address) policyLcn['address'] = compressAddress(lcn.address as Address);
  if (lcn.coordinates) policyLcn['coords'] = lcn.coordinates;
  if (lcn.cancelEffDate) policyLcn['cancelEffDate'] = lcn.cancelEffDate;
  if (lcn.metadata?.version) policyLcn['version'] = lcn.metadata?.version;

  return policyLcn;
};

// ADDITIONAL INTEREST <--> MORTGAGEE / ADDITIONAL NAMED INSURED

export function convertAdditionalInsuredsToAdditionalInterests(
  additionalInsureds: AdditionalInsured[]
): AdditionalInterest[] {
  return additionalInsureds.map((ai) => ({
    type: 'additional_insured',
    name: ai.name,
    accountNumber: '',
    address: {
      addressLine1: ai.address?.addressLine1 || '',
      addressLine2: ai.address?.addressLine2 || '',
      city: ai.address?.city || '',
      state: ai.address?.state || '',
      postal: ai.address?.postal || '',
    } as AddressWithCoords,
  }));
}

export function convertMortgageesToAdditionalInterests(
  mortgagees: Mortgagee[]
): AdditionalInterest[] {
  return mortgagees.map((m) => ({
    type: 'mortgagee',
    name: m.name,
    accountNumber: m.loanNumber,
    address: {
      addressLine1: m.address?.addressLine1 || '',
      addressLine2: m.address?.addressLine2 || '',
      city: m.address?.city || '',
      state: m.address?.state || '',
      postal: m.address?.postal || '',
    } as AddressWithCoords,
  }));
}

export const combineToAdditionalInterests = (
  additionalInsureds: AdditionalInsured[],
  mortgagees: Mortgagee[]
) => [
  ...convertAdditionalInsuredsToAdditionalInterests(additionalInsureds),
  ...convertMortgageesToAdditionalInterests(mortgagees),
];

export function additionalInterestToMortgagee(
  additionalInterests: AdditionalInterest[]
): Mortgagee[] {
  return (
    additionalInterests
      ?.filter((ai) => ai.type === 'mortgagee')
      .map((m) => ({
        name: m.name,
        contactName: '',
        email: m.email || '',
        loanNumber: m.accountNumber || '',
        address: m.address
          ? {
              addressLine1: m.address?.addressLine1 ?? '',
              addressLine2: m.address?.addressLine2 ?? '',
              city: m.address?.city ?? '',
              state: m.address?.state ?? '',
              postal: m.address?.postal ?? '',
            }
          : null,
      })) || []
  );
}

export function additionalInterestToAdditionalInsured(
  additionalInterests: AdditionalInterest[]
): AdditionalInsured[] {
  return (
    additionalInterests
      ?.filter((ai) => ai.type === 'additional_named_insured' || ai.type === 'additional_insured')
      .map((additionalNI) => ({
        name: additionalNI.name,
        email: additionalNI.email || '',
        address: additionalNI.address
          ? {
              addressLine1: additionalNI.address?.addressLine1 ?? '',
              addressLine2: additionalNI.address?.addressLine2 ?? '',
              city: additionalNI.address?.city ?? '',
              state: additionalNI.address?.state ?? '',
              postal: additionalNI.address?.postal ?? '',
            }
          : null,
      })) || []
  );
}

export function separateAdditionalInterests(additionalInterests: AdditionalInterest[]) {
  return {
    additionalInsureds: additionalInterestToAdditionalInsured(additionalInterests),
    mortgageeInterest: additionalInterestToMortgagee(additionalInterests),
  };
}
