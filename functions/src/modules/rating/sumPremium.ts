import { round, sumBy } from 'lodash-es';

import {
  FeeItem,
  LcnWithTermPrem,
  PolicyLcnWithPrem,
  PolicyLocation,
  TaxItem,
} from '../../common/index.js';
import { sumArr, sumByTypes } from '../../utils/arrays.js';
import { recalcTaxes } from '../transactions/taxes.js';

// export type PartialLcnWithTermPrem = WithRequired<
//   Partial<ILocation> | Partial<PolicyLocation>,
//   'termPremium'
// >;

export type PartialLcnWithTermPrem = LcnWithTermPrem | PolicyLcnWithPrem;

/**
 * Sum term premium for array of policy locations (cancelEffDate will be filtered)
 * @param {PartialLcnWithTermPrem[]} locations array of all policy locations
 * @returns {number} total of term premium for each location ()
 */
export const sumPolicyTermPremium = (locations: PartialLcnWithTermPrem[]) => {
  const activeLocations = locations.filter((l) => !l.cancelEffDate);

  return round(sumBy(activeLocations, 'termPremium'), 2);
};

/**
 * Sum term premium for array of policy locations (including cancelled locations)
 * @param {PartialLcnWithTermPrem[]} locations array of all policy locations
 * @returns {number} total of term premium for each location
 */
export const sumPolicyTermPremiumIncludeCancels = (locations: PartialLcnWithTermPrem[]) =>
  round(sumBy(locations, 'termPremium'), 2);

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

// TODO: OKLAHOMA --> no taxes --> need to filter out OK before splitting taxes

export function getInStatePremium(homeState: string, locations: PolicyLocation[]) {
  const total = sumByTypes<PolicyLocation>(locations, 'address.st', homeState, 'termPremium');

  return round(total, 2);
}

export function getOutStatePremium(homeState: string, locations: PolicyLocation[]) {
  const total = locations.reduce((acc, l) => {
    if (l.address?.st && l.address?.st !== homeState && typeof l.termPremium === 'number')
      return acc + l.termPremium;

    return acc;
  }, 0);

  return round(total, 2);
}

export const calcPolicyPremium = (homeState: string, newLocationsArr: PolicyLocation[]) => {
  const termPremium = sumPolicyTermPremium(newLocationsArr);
  const inStatePremium = getInStatePremium(homeState, newLocationsArr);
  const outStatePremium = getOutStatePremium(homeState, newLocationsArr);
  // TODO: calc oklahoma premium

  return { termPremium, inStatePremium, outStatePremium };
};

export const calcPolicyPremiumAndTaxes = (
  lcnArr: PolicyLocation[],
  homeState: string,
  taxes: TaxItem[],
  fees: FeeItem[]
) => {
  const { termPremium, inStatePremium, outStatePremium } = calcPolicyPremium(homeState, lcnArr);

  const termPremiumWithCancels = sumPolicyTermPremiumIncludeCancels(lcnArr);

  const newTaxes = recalcTaxes({
    premium: termPremium,
    homeStatePremium: inStatePremium,
    outStatePremium,
    taxes,
    fees,
  });

  // BUG: if policy cancel, still adding taxes
  // BUG: remove fees if policy cancel ??
  const price = sumFeesTaxesPremium(fees, newTaxes, termPremium);

  return {
    termPremium,
    inStatePremium,
    outStatePremium,
    termPremiumWithCancels,
    price,
    taxes: newTaxes,
  };
};

// by billing entity options:

// option 1:
//    - use current calc policy totals (total up term premium for all locations --> calc taxes & fees)
//    - add up term premium by billing entity --> calc price * (lcnPrem/totalPrem)
//    - check diff in taxes / fees --> if doesn't total --> add diff to largest entity
