
import { getMinPremium } from '../minPremium.js';

describe('getMinPremium', () => {
  it('returns floor minPrem for zone X when TIV is low', () => {
    // zone X: minPrem=300, minRate=0.0004 → rate-based = ceil(0.0004*100) = 1 < 300
    expect(getMinPremium('X', 100)).toBe(300);
  });

  it('returns rate-based premium when it exceeds the floor', () => {
    // zone X: ceil(0.0004 * 2_000_000) = ceil(800) = 800 > 300
    expect(getMinPremium('X', 2_000_000)).toBe(800);
  });

  it('uses higher floor for high-risk zones (A/AE/V)', () => {
    // zone A: minPrem=500, minRate=0.0008 → rate-based = ceil(0.0008*100) = 1 < 500
    expect(getMinPremium('A', 100)).toBe(500);
    expect(getMinPremium('AE', 100)).toBe(500);
    expect(getMinPremium('V', 100)).toBe(500);
  });

  it('uses lower floors for portfolio pricing', () => {
    // portfolio zone A: minPrem=300
    expect(getMinPremium('A', 100, true)).toBe(300);
    // portfolio zone X: minPrem=100
    expect(getMinPremium('X', 100, true)).toBe(100);
  });

  it('falls back to default zone (X) for unknown zone string', () => {
    // unknown zone maps to { minPrem: 300, minRate: 0.0004 }
    expect(getMinPremium('Z99', 100)).toBe(300);
  });

  it('only uses the first character of the flood zone string', () => {
    // 'AE' → first char 'A' → same as passing 'A'
    const ae = getMinPremium('AE', 500_000);
    const a = getMinPremium('A', 500_000);
    expect(ae).toBe(a);
  });
});
