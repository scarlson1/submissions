import { AdditionalInsured, AdditionalInterest, AddressWithCoords, Mortgagee } from 'common';
import { deepmergeCustom } from 'deepmerge-ts';

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

export function additionalInterestsToAdditionalInsured(additionalInterests: AdditionalInterest[]) {
  return (
    additionalInterests
      ?.filter((ai) => ai.type === 'additional_insured')
      .map((additionalNI) => ({
        name: additionalNI.name,
        email: additionalNI.email || '',
        address: additionalNI.address
          ? {
              addressLine1: additionalNI.address.addressLine1,
              addressLine2: additionalNI.address.addressLine2,
              city: additionalNI.address.city,
              state: additionalNI.address.state,
              postal: additionalNI.address.postal,
            }
          : null,
      })) || []
  );
}

export function additionalInterestsToMortgagee(additionalInterests: AdditionalInterest[]) {
  return (
    additionalInterests
      ?.filter((ai) => ai.type === 'mortgagee')
      .map((m) => ({
        name: m.name,
        contactName: '',
        email: m.email || '',
        loanNumber: m.accountNumber,
        address: m.address
          ? {
              addressLine1: m.address.addressLine1,
              addressLine2: m.address.addressLine2,
              city: m.address.city,
              state: m.address.state,
              postal: m.address.postal,
            }
          : null,
      })) || []
  );
}

// Docs: https://github.com/RebeccaStevens/deepmerge-ts/blob/HEAD/docs/deepmergeCustom.md

export const deepMergeOverwriteArrays = deepmergeCustom({
  mergeArrays: false,
});
