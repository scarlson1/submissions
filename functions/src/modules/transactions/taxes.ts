import { ceil, floor, round } from 'lodash';
import {
  FeeItem,
  FeeItemName,
  Policy,
  PolicyLocation,
  RoundingType,
  TaxItem,
  TaxItemName,
  sumByTypes,
} from '../../common';
import { SubjectBaseKeyVal } from '../db';

interface TaxCalcProps {
  premium: number;
  homeStatePremium: number;
  outStatePremium: number;
  taxes: TaxItem[];
  fees: FeeItem[];
}

/**
 * Recalculate tax values if premium of fees change
 * @param {TaxCalcProps} props premium, homeStatePremium, outStatePremium, taxes, fees
 * @returns {TaxItem[]} array of tax items with recalculated values
 */
export const recalcTaxes = (props: TaxCalcProps) => {
  const { premium, homeStatePremium, outStatePremium, taxes, fees } = props;

  const mgaFees = sumMGAFees(fees);
  const inspectionFees = sumFeesByType(fees, 'Inspection Fee');
  const policyVals: SubjectBaseKeyVal = {
    premium,
    homeStatePremium,
    outStatePremium,
    mgaFees,
    inspectionFees,
  };

  const result = taxes.map((tax) => {
    let taxBase = getTaxBase(tax, policyVals);
    const baseRoundingFunc = getRoundingFunc(tax.baseRoundType);
    taxBase = baseRoundingFunc(taxBase);

    const resultRoundingFunc = getRoundingFunc(tax.resultRoundType);
    const newTaxValue = resultRoundingFunc(taxBase * tax.rate, tax.resultDigits ?? 2);

    return { ...tax, value: newTaxValue };
  });

  return result;
};

/**
 * Calculate the tax base from the "SubjectBase" array in the tax config
 * @param {TaxItem} tax tax item object
 * @param  {SubjectBaseKeyVal} policyVals premium, homeStatePrem, outStatePrem, mgaFees, inspectionFees
 * @returns {number} subject base as a number
 */
export function getTaxBase(tax: TaxItem, policyVals: SubjectBaseKeyVal) {
  const baseKeys = tax.subjectBase?.filter((b) => b !== 'fixedFee' && b !== 'noFee');

  return baseKeys.reduce((acc, curr) => {
    const num = typeof curr === 'string' ? policyVals[curr as keyof SubjectBaseKeyVal] : 0;
    return acc + (num ?? 0);
  }, 0);
}

/**
 * returns a lodash rounding function, given the provided string
 * @param {string | null | undefined} type nearest, up, or down
 * @returns {function(): number} rounding function
 */
export function getRoundingFunc(type?: RoundingType | null | undefined) {
  switch (type) {
    case 'nearest':
      return round;
    case 'up':
      return ceil;
    case 'down':
      return floor;
    default:
      return round;
  }
}

/**
 * Sum the value of all fees matching type "MGA Fee"
 * @param {FeeItem[]} fees array of fee items
 * @returns {number} sum of all fees matching "MGA Fee"
 */
export function sumMGAFees(fees: FeeItem[]) {
  return sumByTypes<FeeItem>(fees, 'feeName', 'MGA Fee', 'value');
}

/**
 * Sum the value of all fees matching type
 * @param {FeeItem[]} fees array of fee items
 * @param {FeeItemName | FeeItemName[]} type type of fee to include in type
 * @returns {number} sum of all fees matching type
 */
export function sumFeesByType(fees: FeeItem[], type: FeeItemName | FeeItemName[]) {
  return sumByTypes<FeeItem>(fees, 'feeName', type, 'value');
}

/**
 * Sum the value of all taxes matching type
 * @param {TaxItem[]} taxes array of tax items
 * @param {TaxItemName | TaxItemName[]} type type of taxes to include in type
 * @returns {number} sum of all taxes matching type
 */
export function sumTaxesByType(taxes: TaxItem[], type: TaxItemName | TaxItemName[]) {
  return sumByTypes<TaxItem>(taxes, 'displayName', type, 'value');
}

export function getTrxTaxesAndFees({ taxes, fees }: Policy) {
  const surplusLinesTax = sumTaxesByType(taxes, 'Premium Tax');
  const surplusLinesRegulatoryFee = sumTaxesByType(taxes, 'Regulatory Fee');
  const MGAFee = sumFeesByType(fees, 'MGA Fee');
  const inspectionFee = sumFeesByType(fees, 'Inspection Fee');

  return { surplusLinesTax, surplusLinesRegulatoryFee, MGAFee, inspectionFee };
}

export function getInStatePremium(homeState: string, locations: PolicyLocation[]) {
  return sumByTypes<PolicyLocation>(locations, 'address.state', homeState, 'termPremium');
}

export function getOutStatePremium(homeState: string, locations: PolicyLocation[]) {
  return locations.reduce((acc, l) => {
    if (l.address?.state && l.address?.state !== homeState && typeof l.termPremium === 'number')
      return acc + l.termPremium;

    return acc;
  }, 0);
}
