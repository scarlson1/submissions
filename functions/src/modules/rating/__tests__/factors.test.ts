
import { calcSecondaryMult, getBasementFactor, getHistoryMultInland, getHistoryMultSurge, getPM } from '../factors.js';

describe('getPM', () => {
  it('computes (aal * 1000) / tiv', () => {
    expect(getPM(100, 1_000_000)).toBeCloseTo(0.1, 5);
  });

  it('scales linearly with AAL', () => {
    expect(getPM(200, 1_000_000)).toBeCloseTo(0.2, 5);
  });
});

describe('getHistoryMultInland', () => {
  it('returns 1 for score <= 1 (no history)', () => {
    expect(getHistoryMultInland(0)).toBe(1);
    expect(getHistoryMultInland(1)).toBe(1);
  });

  it('returns 1.25 for score in 2-21', () => {
    expect(getHistoryMultInland(10)).toBe(1.25);
    expect(getHistoryMultInland(21)).toBe(1.25);
  });

  it('returns 1.5 for score in 22-51', () => {
    expect(getHistoryMultInland(22)).toBe(1.5);
    expect(getHistoryMultInland(51)).toBe(1.5);
  });

  it('returns 1.75 for score in 52-71', () => {
    expect(getHistoryMultInland(52)).toBe(1.75);
    expect(getHistoryMultInland(71)).toBe(1.75);
  });

  it('returns null for score > 71 (unratable)', () => {
    expect(getHistoryMultInland(72)).toBeNull();
  });
});

describe('getHistoryMultSurge', () => {
  it('returns 1 for score <= 1', () => {
    expect(getHistoryMultSurge(1)).toBe(1);
  });

  it('returns 1.5 for score in 2-21', () => {
    expect(getHistoryMultSurge(10)).toBe(1.5);
  });

  it('returns null for score > 51', () => {
    expect(getHistoryMultSurge(52)).toBeNull();
  });
});

describe('getBasementFactor', () => {
  it('returns 0.86 for "no"', () => {
    expect(getBasementFactor('no')).toBe(0.86);
  });

  it('returns 0.86 for "no basement"', () => {
    expect(getBasementFactor('no basement')).toBe(0.86);
  });

  it('returns 1.29 for "finished"', () => {
    expect(getBasementFactor('finished')).toBe(1.29);
  });

  it('returns 1.03 for "unfinished"', () => {
    expect(getBasementFactor('unfinished')).toBe(1.03);
  });

  it('returns 1.29 (worst case) for unknown values', () => {
    expect(getBasementFactor('unknown')).toBe(1.29);
    expect(getBasementFactor()).toBe(1.29);
  });

  it('is case-insensitive', () => {
    expect(getBasementFactor('No')).toBe(0.86);
    expect(getBasementFactor('FINISHED')).toBe(1.29);
  });
});

describe('calcSecondaryMult', () => {
  it('returns product of all multiplier factors', () => {
    // constants: CONTENTS_RCV_MULT=1, ORDINANCE_MULT=1.05, DISTANCE_TO_COAST_MULT=1, TIER_1_MULT=1
    const result = calcSecondaryMult(1.25, 1.1, 0.86);
    const expected = 1 * 1.05 * 1 * 1 * 1.25 * 1.1 * 0.86;
    expect(result).toBeCloseTo(expected, 5);
  });

  it('returns 0 when any factor is 0', () => {
    expect(calcSecondaryMult(0, 1, 1)).toBe(0);
  });
});
