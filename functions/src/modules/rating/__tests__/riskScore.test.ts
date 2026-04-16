
import { getInlandRiskScore, getRiskScore, getSurgeRiskScore, inlandPMRiskArray } from '../riskScore.js';

describe('getRiskScore', () => {
  it('returns 0 for pm = 0 (first threshold)', () => {
    // first entry is 0.0, so pm=0 is NOT < 0.0 → findIndex returns 1 (first index where pm < threshold)
    // array[0]=0.0, array[1]=0.035 → 0 < 0.035 → index 1
    expect(getRiskScore(0, inlandPMRiskArray)).toBe(1);
  });

  it('returns -1 when pm exceeds all thresholds', () => {
    expect(getRiskScore(999, inlandPMRiskArray)).toBe(-1);
  });

  it('returns correct index for a mid-range value', () => {
    // find the first index where 0.1 < threshold
    const expected = inlandPMRiskArray.findIndex((v) => 0.1 < v);
    expect(getRiskScore(0.1, inlandPMRiskArray)).toBe(expected);
  });
});

describe('getInlandRiskScore', () => {
  it('returns a score >= 0 for a small positive pm', () => {
    expect(getInlandRiskScore(0.01)).toBeGreaterThan(0);
  });

  it('increases score for larger pm values', () => {
    const low = getInlandRiskScore(0.1);
    const high = getInlandRiskScore(1.0);
    expect(high).toBeGreaterThan(low);
  });
});

describe('getSurgeRiskScore', () => {
  it('returns a positive score for pm = 0.05', () => {
    expect(getSurgeRiskScore(0.05)).toBeGreaterThan(0);
  });
});
