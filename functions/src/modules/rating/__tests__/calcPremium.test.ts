import {
  getPremium,
  getPremiumData,
  getTechPremium,
  INLAND_LAE_FACTOR,
} from '../calcPremium.js';
import { getCommRates } from '../commRates.js';

describe('getTechPremium', () => {
  it('returns 0 when AALs is null', () => {
    expect(getTechPremium(null, 1.2, INLAND_LAE_FACTOR)).toBe(0);
  });

  it('returns 0 when AALs is 0', () => {
    expect(getTechPremium(0, 1.2, INLAND_LAE_FACTOR)).toBe(0);
  });

  it('computes AALs * secModMult * (1 + LAE)', () => {
    expect(getTechPremium(100, 1, 0.1)).toBeCloseTo(110, 5);
  });

  it('scales linearly with AALs', () => {
    const a = getTechPremium(100, 1.2, 0.1);
    const b = getTechPremium(200, 1.2, 0.1);
    expect(b).toBeCloseTo(a * 2, 5);
  });
});

describe('getPremium', () => {
  it('returns techPremium / (1 - com) * multiplier', () => {
    const result = getPremium(100, 1, 0.3);
    expect(result).toBeCloseTo(142.857, 2);
  });

  it('returns 0 when techPremium is 0', () => {
    expect(getPremium(0, 1, 0.3)).toBe(0);
  });
});

describe('getCommRates', () => {
  it('returns correct rates for 15% commission', () => {
    const rates = getCommRates(0.15);
    expect(rates.subprodAdjRate).toBe(0);
    expect(rates.totalCommRate).toBe(0.3);
  });

  it('throws for unknown commission rate', () => {
    expect(() => getCommRates(0.99)).toThrow('out of range');
  });

  it('returns higher totalCommRate for higher subproducer commission', () => {
    const low = getCommRates(0.1);
    const high = getCommRates(0.2);
    expect(high.totalCommRate).toBeGreaterThan(low.totalCommRate);
  });
});

describe('getPremiumData', () => {
  const baseProps = {
    AALs: { inland: 500, surge: 200, tsunami: 50 },
    secondaryFactorMults: { inland: 1, surge: 1, tsunami: 1 },
    stateMultipliers: { inland: 1, surge: 1, tsunami: 1 },
    minPremium: 300,
    subproducerComPct: 0.15,
  };

  it('returns an object with annualPremium > 0', () => {
    const result = getPremiumData(baseProps);
    expect(result.annualPremium).toBeGreaterThan(0);
  });

  it('annualPremium >= provisionalPremium when subprodAdjRate >= 0', () => {
    const result = getPremiumData(baseProps);
    // at 15% commission, subprodAdjRate is 0, so annual === provisional
    expect(result.annualPremium).toBe(result.provisionalPremium);
  });

  it('applies minPremium when computed premium is below it', () => {
    const lowAALs = { ...baseProps, AALs: { inland: 0, surge: 0, tsunami: 0 } };
    const result = getPremiumData(lowAALs);
    expect(result.provisionalPremium).toBeGreaterThanOrEqual(
      lowAALs.minPremium,
    );
  });

  it('techPremium total equals sum of inland + surge + tsunami', () => {
    const result = getPremiumData(baseProps);
    const { inland, surge, tsunami, total } = result.techPremium;
    expect(total).toBeCloseTo(inland + surge + tsunami, 5);
  });
});
