
import { getRCVs } from '../getRCVs.js';

describe('getRCVs', () => {
  const limits = { limitA: 250000, limitB: 0, limitC: 100000, limitD: 0 };

  it('uses replacementCost when it exceeds limitA', () => {
    const result = getRCVs(300000, limits);
    expect(result.building).toBe(300000);
  });

  it('uses limitA when replacementCost is below limitA', () => {
    const result = getRCVs(200000, limits);
    expect(result.building).toBe(250000);
  });

  it('maps limitB/C/D to otherStructures/contents/BI', () => {
    const result = getRCVs(300000, limits);
    expect(result.otherStructures).toBe(0);
    expect(result.contents).toBe(100000);
    expect(result.BI).toBe(0);
  });

  it('computes total as sum of all coverage values', () => {
    const result = getRCVs(300000, { limitA: 250000, limitB: 10000, limitC: 50000, limitD: 5000 });
    expect(result.total).toBe(300000 + 10000 + 50000 + 5000);
  });

  it('total equals sum of individual fields', () => {
    const result = getRCVs(150000, limits);
    const { total, ...parts } = result;
    const sum = Object.values(parts).reduce((acc, v) => acc + v, 0);
    expect(total).toBe(sum);
  });
});
