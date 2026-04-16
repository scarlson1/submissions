
import type { FeeItem, TaxItem } from '@idemand/common';
import {
  calcPolicyPremium,
  getInStatePremium,
  getOutStatePremium,
  sumFees,
  sumFeesTaxesPremium,
  sumPolicyTermPremium,
  sumPolicyTermPremiumIncludeCancels,
  sumTaxes,
} from '../sumPremium.js';

// Minimal location stubs — only fields used by these functions
const makeLcn = (termPremium: number, state = 'TX', cancelEffDate: any = null) =>
  ({
    termPremium,
    cancelEffDate,
    address: { st: state },
  }) as any;

const makeTax = (value: number): TaxItem =>
  ({ displayName: 'Premium Tax', value, rate: 0.01, subjectBase: ['premium'], baseRoundType: null, resultRoundType: 'nearest', resultDigits: 2 }) as any;

const makeFee = (value: number): FeeItem =>
  ({ displayName: 'MGA Fee', value }) as any;

describe('sumPolicyTermPremium', () => {
  it('sums only active (non-cancelled) locations', () => {
    const locs = [makeLcn(1000), makeLcn(500, 'TX', '2024-01-01'), makeLcn(200)];
    expect(sumPolicyTermPremium(locs)).toBe(1200);
  });

  it('returns 0 when all locations are cancelled', () => {
    const locs = [makeLcn(1000, 'TX', '2024-01-01')];
    expect(sumPolicyTermPremium(locs)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(sumPolicyTermPremium([])).toBe(0);
  });
});

describe('sumPolicyTermPremiumIncludeCancels', () => {
  it('includes cancelled locations', () => {
    const locs = [makeLcn(1000), makeLcn(500, 'TX', '2024-01-01')];
    expect(sumPolicyTermPremiumIncludeCancels(locs)).toBe(1500);
  });
});

describe('sumTaxes', () => {
  it('sums tax values', () => {
    expect(sumTaxes([makeTax(100), makeTax(50)])).toBe(150);
  });

  it('returns 0 for empty array', () => {
    expect(sumTaxes([])).toBe(0);
  });
});

describe('sumFees', () => {
  it('sums fee values', () => {
    expect(sumFees([makeFee(25), makeFee(75)])).toBe(100);
  });
});

describe('sumFeesTaxesPremium', () => {
  it('sums premium + fees + taxes', () => {
    const result = sumFeesTaxesPremium([makeFee(50)], [makeTax(30)], 1000);
    expect(result).toBeCloseTo(1080, 2);
  });
});

describe('getInStatePremium', () => {
  it('sums only in-state location premiums', () => {
    const locs = [makeLcn(1000, 'TX'), makeLcn(500, 'LA'), makeLcn(200, 'TX')];
    expect(getInStatePremium('TX', locs as any)).toBeCloseTo(1200, 2);
  });
});

describe('getOutStatePremium', () => {
  it('sums only out-of-state location premiums', () => {
    const locs = [makeLcn(1000, 'TX'), makeLcn(500, 'LA'), makeLcn(200, 'TX')];
    expect(getOutStatePremium('TX', locs as any)).toBeCloseTo(500, 2);
  });
});

describe('calcPolicyPremium', () => {
  it('returns correct termPremium, inState, and outState', () => {
    const locs = [makeLcn(1000, 'TX'), makeLcn(500, 'LA')];
    const result = calcPolicyPremium('TX', locs as any);
    expect(result.termPremium).toBe(1500);
    expect(result.inStatePremium).toBeCloseTo(1000, 2);
    expect(result.outStatePremium).toBeCloseTo(500, 2);
  });
});
