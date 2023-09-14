import { round } from 'lodash';

import {
  FeeItem,
  ILocation,
  PolicyLocation,
  TaxItem,
  WithRequired,
  sumArr,
  sumByTypes,
} from '../../common';

export type PolicyWithTermPrem = WithRequired<
  Partial<ILocation> | Partial<PolicyLocation>,
  'termPremium'
>;

/**
 * Sum term premium for array of policy locations (cancelEffDate will be filtered)
 * @param {PolicyWithTermPrem[]} locations array of all policy locations
 * @returns {number} total of term premium for each location ()
 */
export const sumPolicyTermPremium = (locations: PolicyWithTermPrem[]) => {
  const activeTermPremium = locations.filter((l) => !l.cancelEffDate).map((l) => l.termPremium);
  const total = sumArr(activeTermPremium);

  return round(total, 2);
};

/**
 * Compute total value of taxes in an array of TaxItems
 * @param {TaxItem[]} taxes taxes array - sums tax.value
 * @returns {number} sum of all tax values
 */
export const sumTaxes = (taxes: TaxItem[]) => sumArr(taxes.map((t) => t.value));

/**
 * Compute total value of fees in an array of FeeItems
 * @param {FeeItem[]} fees taxes array - sums tax.value
 * @returns {number} sum of all fee values
 */
export const sumFees = (fees: FeeItem[]) => sumArr(fees.map((f) => f.value));

/**
 * Compute sum of taxes, fees and premium for a policy
 * @param {FeeItem[]} fees array of fees
 * @param {TaxItem[]} taxes array of taxes
 * @param {number} premium premium
 * @returns {number} total of all taxes + fees + premium
 */
export function sumFeesTaxesPremium(fees: FeeItem[], taxes: TaxItem[], premium: number) {
  const feeTotal = sumFees(fees);
  const taxTotal = sumTaxes(taxes);

  return round(premium + feeTotal + taxTotal, 2);
}

export function getInStatePremium(homeState: string, locations: PolicyLocation[]) {
  return sumByTypes<PolicyLocation>(locations, 'address.st', homeState, 'termPremium');
}

export function getOutStatePremium(homeState: string, locations: PolicyLocation[]) {
  return locations.reduce((acc, l) => {
    if (l.address?.st && l.address?.st !== homeState && typeof l.termPremium === 'number')
      return acc + l.termPremium;

    return acc;
  }, 0);
}

export const calcPolicyPremium = (homeState: string, newLocationsArr: PolicyLocation[]) => {
  const termPremium = sumPolicyTermPremium(newLocationsArr);
  const inStatePremium = getInStatePremium(homeState, newLocationsArr);
  const outStatePremium = getOutStatePremium(homeState, newLocationsArr);

  return { termPremium, inStatePremium, outStatePremium };
};
