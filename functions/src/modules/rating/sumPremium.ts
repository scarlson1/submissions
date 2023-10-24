import { groupBy, maxBy, round, sumBy } from 'lodash-es';

import {
  FeeItem,
  LcnWithTermPrem,
  PolicyLcnWithPrem,
  PolicyLocation,
  State,
  TaxItem,
  TotalsByBillingEntity,
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
  const oklahomaPremium = sumBy(
    newLocationsArr.filter((lcn) => lcn.address?.st === State.enum.OK),
    'termPremium'
  );

  return { termPremium, inStatePremium, outStatePremium, oklahomaPremium };
};

export const calcPremiumByBillingEntity = (
  lcnArr: PolicyLocation[],
  premium: number,
  taxes: TaxItem[],
  fees: FeeItem[]
) => {
  const lcnsByEntity = groupBy(lcnArr, ({ billingEntityId }) => billingEntityId || 'default');

  // return early if only one billing entity
  if (Object.keys(lcnsByEntity).length === 1) {
    return {
      [Object.keys(lcnsByEntity)[0]]: {
        termPremium: premium,
        taxes,
        fees,
        price: sumFeesTaxesPremium(fees, taxes, premium),
      },
    };
  }

  const totalsByEntity: TotalsByBillingEntity = {};

  for (const entityId in lcnsByEntity) {
    const entityPremium = sumBy(lcnsByEntity[entityId], 'termPremium');
    const entityPremPct = entityPremium / premium;

    const entityTaxes = taxes.map((t) => ({
      ...t,
      value: round(entityPremPct * t.value, 2),
    }));

    const entityFees = fees.map((f) => ({
      ...f,
      value: round(entityPremPct * f.value, 2),
    }));

    const price = sumFeesTaxesPremium(entityFees, entityTaxes, entityPremium);

    totalsByEntity[entityId] = {
      termPremium: entityPremium,
      taxes: entityTaxes,
      fees: entityFees,
      price,
    };
  }

  let largestEntity = maxBy(Object.entries(totalsByEntity), ([id, totals]) => totals.termPremium);
  const largestEntityId = largestEntity ? largestEntity[0] : null;

  const totalsObj = Object.values(totalsByEntity);

  for (let i = 0; i < taxes.length; i++) {
    const policyTaxTotal = taxes[i].value;
    const entitiesTaxTotal = sumBy(totalsObj, ({ taxes }) => taxes[i].value);

    const taxDiff = round(policyTaxTotal - entitiesTaxTotal, 2);
    if (taxDiff !== 0 && largestEntityId) {
      totalsByEntity[largestEntityId].taxes[i].value += taxDiff;
    }
  }

  for (let i = 0; i < fees.length; i++) {
    const policyFeeTotal = fees[i].value;
    const entitiesFeeTotal = sumBy(totalsObj, ({ fees }) => fees[i].value);

    const feeDiff = round(policyFeeTotal - entitiesFeeTotal, 2);
    if (feeDiff !== 0 && largestEntityId) {
      totalsByEntity[largestEntityId].fees[i].value += feeDiff;
    }
  }

  return totalsByEntity;
};

export const calcPolicyPremiumAndTaxes = (
  lcnArr: PolicyLocation[],
  homeState: string,
  taxes: TaxItem[],
  fees: FeeItem[]
) => {
  const { termPremium, inStatePremium, outStatePremium, oklahomaPremium } = calcPolicyPremium(
    homeState,
    lcnArr
  );

  const termPremiumWithCancels = sumPolicyTermPremiumIncludeCancels(lcnArr);

  let recalcArgs = {
    premium: termPremium,
    homeStatePremium: inStatePremium,
    outStatePremium,
    taxes,
    fees,
  };
  if (homeState === State.enum.OK) {
    recalcArgs['premium'] = termPremium - oklahomaPremium;
    recalcArgs['homeStatePremium'] = Math.max(inStatePremium - oklahomaPremium, 0);
    recalcArgs['outStatePremium'] = Math.max(outStatePremium - oklahomaPremium, 0);
  }

  const newTaxes = recalcTaxes(recalcArgs);

  // BUG: if policy cancel, still adding taxes
  // BUG: remove fees if policy cancel ??
  const price = sumFeesTaxesPremium(fees, newTaxes, termPremium);

  const totalsByBillingEntity = calcPremiumByBillingEntity(lcnArr, termPremium, newTaxes, fees);

  return {
    termPremium,
    inStatePremium,
    outStatePremium,
    termPremiumWithCancels,
    price,
    taxes: newTaxes,
    totalsByBillingEntity,
  };
};
