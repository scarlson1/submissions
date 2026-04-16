import { add } from 'date-fns';
import {
  calcTerm,
  constructTrxId,
  getDailyPremium,
  getNetDWP,
  getTermDays,
  getTermProratedPct,
} from '../utils.js';

// ── constructTrxId ───────────────────────────────────────────────────────────

describe('constructTrxId', () => {
  it('joins policyId, locationId, and eventId with dashes', () => {
    expect(constructTrxId('pol-1', 'loc-2', 'evt-3')).toBe('pol-1-loc-2-evt-3');
  });
});

// ── getDailyPremium ──────────────────────────────────────────────────────────

describe('getDailyPremium', () => {
  it('divides termPremium by termDays and rounds to 2 decimal places', () => {
    expect(getDailyPremium(365, 365)).toBe(1);
    expect(getDailyPremium(1000, 365)).toBeCloseTo(2.74, 2);
  });

  it('rounds to 2 decimal places', () => {
    const result = getDailyPremium(100, 7);
    expect(result).toBe(Math.round((100 / 7) * 100) / 100);
  });
});

// ── getTermProratedPct ───────────────────────────────────────────────────────

describe('getTermProratedPct', () => {
  it('returns 1 when location term equals policy term', () => {
    expect(getTermProratedPct(365, 365)).toBe(1);
  });

  it('returns correct ratio for a mid-term endorsement', () => {
    expect(getTermProratedPct(365, 182)).toBeCloseTo(0.4986, 3);
  });

  it('returns > 1 when location term is longer than policy term', () => {
    expect(getTermProratedPct(180, 365)).toBeGreaterThan(1);
  });
});

// ── getNetDWP ────────────────────────────────────────────────────────────────

describe('getNetDWP', () => {
  it('subtracts MGAComm from termPremium', () => {
    expect(getNetDWP(1000, 300)).toBe(700);
  });

  it('returns negative when MGA commission exceeds premium', () => {
    expect(getNetDWP(100, 150)).toBe(-50);
  });
});

// ── getTermDays ──────────────────────────────────────────────────────────────

describe('getTermDays', () => {
  it('returns number of calendar days between two dates', () => {
    const eff = new Date('2024-01-01');
    const exp = new Date('2025-01-01');
    expect(getTermDays(eff, exp)).toBe(366); // 2024 is a leap year
  });

  it('returns 365 for a standard non-leap year', () => {
    expect(getTermDays(new Date('2023-01-01'), new Date('2024-01-01'))).toBe(365);
  });

  it('returns negative when expDate is before effDate', () => {
    expect(getTermDays(new Date('2025-01-01'), new Date('2024-01-01'))).toBeLessThan(0);
  });
});

// ── calcTerm ─────────────────────────────────────────────────────────────────

describe('calcTerm', () => {
  it('returns termDays = 366 and full premium for a leap-year annual term', () => {
    const eff = new Date('2024-01-01');
    const exp = new Date('2025-01-01');
    const { termDays, termPremium } = calcTerm(1200, eff, exp);
    expect(termDays).toBe(366);
    // termPremium = round((366/366) * 1200, 2)
    expect(termPremium).toBeCloseTo(1200, 2);
  });

  it('prorates premium for a partial term', () => {
    const eff = new Date('2024-07-01');
    const exp = new Date('2025-01-01');
    const { termDays, termPremium } = calcTerm(1200, eff, exp);
    expect(termDays).toBe(184);
    // yearDays = getTermDays(2024-01-01, 2025-01-01) = 366
    expect(termPremium).toBeCloseTo((184 / 366) * 1200, 2);
  });

  it('termDays matches getTermDays result', () => {
    const eff = new Date('2024-03-15');
    const exp = add(eff, { years: 1 });
    const { termDays } = calcTerm(1000, eff, exp);
    expect(termDays).toBe(getTermDays(eff, exp));
  });
});
