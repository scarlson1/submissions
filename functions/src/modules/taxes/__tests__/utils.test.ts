
import type { FeeItem, TaxItem } from '@idemand/common';
import { getRoundingFunc, getTaxBase, recalcTaxes, sumFeesByType, sumTaxesByType } from '../utils.js';

const makeTax = (overrides: Partial<TaxItem> = {}): TaxItem =>
  ({
    displayName: 'Premium Tax',
    value: 10,
    rate: 0.02,
    subjectBase: ['premium'],
    baseRoundType: 'nearest',
    resultRoundType: 'nearest',
    resultDigits: 2,
    ...overrides,
  }) as any;

const makeFee = (displayName: string, value: number): FeeItem =>
  ({ displayName, value }) as any;

const policyVals = {
  premium: 1000,
  homeStatePremium: 800,
  outStatePremium: 200,
  mgaFees: 50,
  inspectionFees: 25,
};

describe('getTaxBase', () => {
  it('returns 1 for fixedFee subject base', () => {
    const tax = makeTax({ subjectBase: ['fixedFee'] as any });
    expect(getTaxBase(tax, policyVals)).toBe(1);
  });

  it('sums premium as subject base', () => {
    const tax = makeTax({ subjectBase: ['premium'] });
    expect(getTaxBase(tax, policyVals)).toBe(1000);
  });

  it('sums homeStatePremium + outStatePremium', () => {
    const tax = makeTax({ subjectBase: ['homeStatePremium', 'outStatePremium'] });
    expect(getTaxBase(tax, policyVals)).toBe(1000);
  });

  it('ignores noFee from base', () => {
    const tax = makeTax({ subjectBase: ['noFee', 'premium'] as any });
    expect(getTaxBase(tax, policyVals)).toBe(1000);
  });
});

describe('getRoundingFunc', () => {
  it('rounds to nearest for "nearest"', () => {
    expect(getRoundingFunc('nearest')(2.567, 2)).toBeCloseTo(2.57, 2);
  });

  it('rounds up for "up"', () => {
    expect(getRoundingFunc('up')(2.1)).toBe(3);
  });

  it('rounds down for "down"', () => {
    expect(getRoundingFunc('down')(2.9)).toBe(2);
  });

  it('defaults to round for undefined', () => {
    expect(getRoundingFunc(undefined)(2.567, 2)).toBeCloseTo(2.57, 2);
  });
});

describe('sumFeesByType', () => {
  const fees = [makeFee('MGA Fee', 100), makeFee('Inspection Fee', 50), makeFee('MGA Fee', 25)];

  it('sums fees of a given type', () => {
    expect(sumFeesByType(fees, 'MGA Fee')).toBe(125);
  });

  it('returns 0 when no fees match', () => {
    expect(sumFeesByType(fees, 'Other Fee' as any)).toBe(0);
  });
});

describe('sumTaxesByType', () => {
  const taxes = [
    makeTax({ displayName: 'Premium Tax', value: 20 }),
    makeTax({ displayName: 'Regulatory Fee', value: 10 }),
    makeTax({ displayName: 'Premium Tax', value: 5 }),
  ];

  it('sums taxes of a given type', () => {
    expect(sumTaxesByType(taxes, 'Premium Tax')).toBe(25);
  });
});

describe('recalcTaxes', () => {
  it('recalculates tax values based on premium and rate', () => {
    const taxes = [makeTax({ rate: 0.02, subjectBase: ['premium'], value: 0 })];
    const result = recalcTaxes({ premium: 1000, homeStatePremium: 800, outStatePremium: 200, taxes, fees: [] });
    // base = 1000, rounded = 1000, result = round(1000 * 0.02, 2) = 20
    expect(result[0].value).toBe(20);
  });

  it('returns same number of tax items as input', () => {
    const taxes = [makeTax(), makeTax({ displayName: 'Regulatory Fee' as any })];
    const result = recalcTaxes({ premium: 500, homeStatePremium: 500, outStatePremium: 0, taxes, fees: [] });
    expect(result).toHaveLength(2);
  });

  it('includes MGA fees in mgaFees base when applicable', () => {
    const taxes = [makeTax({ subjectBase: ['mgaFees'], rate: 0.1, value: 0 })];
    const fees = [makeFee('MGA Fee', 100)];
    const result = recalcTaxes({ premium: 1000, homeStatePremium: 1000, outStatePremium: 0, taxes, fees });
    // base = mgaFees = 100, result = round(100 * 0.1, 2) = 10
    expect(result[0].value).toBe(10);
  });
});
