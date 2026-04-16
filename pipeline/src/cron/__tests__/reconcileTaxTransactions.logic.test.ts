import { reconcile, round, subDays } from '../reconcileTaxTransactions.logic.js';

// Minimal Timestamp stand-in — no firebase-admin needed here
const NOW = { seconds: 1713139200, nanoseconds: 0 } as any;

// ---------------------------------------------------------------------------
// Helpers to build minimal fixtures
// ---------------------------------------------------------------------------

function makeTrx(overrides: Record<string, any> = {}) {
  return {
    id: 'trx_1',
    type: 'transaction',
    taxId: 'tax_1',
    taxCalcId: 'calc_1',
    policyId: 'pol_1',
    chargeAmount: 1000,
    taxAmount: 50,
    reversal: null,
    ...overrides,
  } as any;
}

function makeCalcSnap(overrides: Record<string, any> = {}) {
  return {
    id: 'calc_1',
    data: {
      value: 50,
      state: 'CA',
      transactionTypes: ['new_business'],
      ...overrides,
    },
  } as any;
}

function makeReversalTrx(overrides: Record<string, any> = {}) {
  return makeTrx({
    id: 'trx_rev_1',
    type: 'reversal',
    taxAmount: -50,
    chargeAmount: -1000,
    reversal: { originalTransactionId: 'trx_1' },
    ...overrides,
  });
}

function makeOgTrxSnap(overrides: Record<string, any> = {}) {
  return {
    id: 'trx_1',
    data: {
      type: 'transaction',
      taxAmount: 50,
      chargeAmount: 1000,
      ...overrides,
    },
  } as any;
}

// ---------------------------------------------------------------------------
// round()
// ---------------------------------------------------------------------------

describe('round', () => {
  test('rounds to 2 decimal places', () => {
    expect(round(1.234)).toBe(1.23);
    expect(round(1.235)).toBe(1.24);
    expect(round(0.1 + 0.2)).toBe(0.3); // floating-point addition corrected
    expect(round(10.1)).toBe(10.1);
  });

  test('handles whole numbers', () => {
    expect(round(5)).toBe(5);
    expect(round(0)).toBe(0);
  });

  test('handles negative numbers', () => {
    expect(round(-1.005)).toBe(-1);
    expect(round(-1.006)).toBe(-1.01);
  });
});

// ---------------------------------------------------------------------------
// subDays()
// ---------------------------------------------------------------------------

describe('subDays', () => {
  test('subtracts exact number of days in ms', () => {
    const base = new Date('2026-04-15T00:00:00.000Z');
    const result = subDays(base, 7);
    expect(result.toISOString()).toBe('2026-04-08T00:00:00.000Z');
  });

  test('subtracting 0 days returns same time', () => {
    const base = new Date('2026-04-15T12:00:00.000Z');
    expect(subDays(base, 0).getTime()).toBe(base.getTime());
  });

  test('handles month boundary', () => {
    const base = new Date('2026-04-01T00:00:00.000Z');
    const result = subDays(base, 2);
    expect(result.toISOString()).toBe('2026-03-30T00:00:00.000Z');
  });
});

// ---------------------------------------------------------------------------
// reconcile() — transaction type
// ---------------------------------------------------------------------------

describe('reconcile — transaction type', () => {
  test('no errors when actual matches expected', () => {
    const result = reconcile([makeTrx()], [makeCalcSnap()], [], NOW);
    expect(result.errors).toHaveLength(0);
    expect(result.totalTaxCollected).toBe(50);
    expect(result.totalTaxRefunded).toBe(0);
    expect(result.totalDiscrepancyAmount).toBe(0);
  });

  test('missing_tax_calc error when taxCalcSnap is absent', () => {
    const result = reconcile([makeTrx()], [], [], NOW);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].errorType).toBe('missing_tax_calc');
    expect(result.errors[0].taxCalcId).toBeNull();
    expect(result.errors[0].expectedAmount).toBeNull();
    expect(result.errors[0].actualAmount).toBe(50);
    expect(result.totalDiscrepancyAmount).toBe(50);
  });

  test('amount_mismatch error when delta exceeds absolute threshold (0.01)', () => {
    // expected = 50, actual = 50.02 → delta = 0.02 > max(0.01, 0.001*50=0.05)
    // 0.02 > 0.05? No. Need a bigger mismatch.
    // expected = 50, actual = 50.10 → delta = 0.10 > max(0.01, 0.05) = 0.05 → YES
    const result = reconcile(
      [makeTrx({ taxAmount: 50.1 })],
      [makeCalcSnap({ value: 50 })],
      [],
      NOW,
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].errorType).toBe('amount_mismatch');
    expect(result.errors[0].expectedAmount).toBe(50);
    expect(result.errors[0].actualAmount).toBe(50.1);
  });

  test('no error when delta is within threshold', () => {
    // expected = 50, actual = 50.04 → delta = 0.04, threshold = max(0.01, 0.05) = 0.05 → 0.04 <= 0.05 OK
    const result = reconcile(
      [makeTrx({ taxAmount: 50.04 })],
      [makeCalcSnap({ value: 50 })],
      [],
      NOW,
    );
    expect(result.errors).toHaveLength(0);
  });

  test('amount_mismatch threshold scales with expected value', () => {
    // expected = 10000, threshold = max(0.01, 10) = 10
    // actual = 10015 → delta = 15 > 10 → mismatch
    const result = reconcile(
      [makeTrx({ taxAmount: 10015 })],
      [makeCalcSnap({ value: 10000 })],
      [],
      NOW,
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].errorType).toBe('amount_mismatch');
  });

  test('error has correct detectedAt and status', () => {
    const result = reconcile([makeTrx()], [], [], NOW);
    const err = result.errors[0];
    expect(err.detectedAt).toBe(NOW);
    expect(err.status).toBe('open');
    expect(err.metadata.created).toBe(NOW);
    expect(err.metadata.updated).toBe(NOW);
  });

  test('accumulates totalTaxCollected across multiple transactions', () => {
    const trxs = [
      makeTrx({ id: 'trx_1', taxCalcId: 'calc_1', taxAmount: 50 }),
      makeTrx({ id: 'trx_2', taxCalcId: 'calc_2', taxAmount: 30 }),
    ];
    const calcs = [
      makeCalcSnap({ value: 50 }),
      { id: 'calc_2', data: { value: 30, state: 'TX', transactionTypes: ['renewal'] } },
    ];
    const result = reconcile(trxs as any, calcs as any, [], NOW);
    expect(result.totalTaxCollected).toBe(80);
    expect(result.errors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// reconcile() — reversal type
// ---------------------------------------------------------------------------

describe('reconcile — reversal type', () => {
  test('no errors for a clean proportional full reversal', () => {
    const result = reconcile(
      [makeReversalTrx()],
      [makeCalcSnap()],
      [makeOgTrxSnap()],
      NOW,
    );
    expect(result.errors).toHaveLength(0);
    expect(result.totalTaxRefunded).toBe(50);
  });

  test('reversal_exceeds_original when refund tax > original tax', () => {
    // reversal taxAmount = -60, original taxAmount = 50 → |−60| > |50|
    const result = reconcile(
      [makeReversalTrx({ taxAmount: -60, chargeAmount: -1000 })],
      [makeCalcSnap()],
      [makeOgTrxSnap()],
      NOW,
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].errorType).toBe('reversal_exceeds_original');
  });

  test('reversal_disproportionate when tax/charge ratio drifts > 1%', () => {
    // original: tax=50, charge=1000 → ratio 0.05
    // reversal: tax=-25, charge=-400 → ratio 0.0625 → |0.05 - 0.0625| = 0.0125 > 0.01
    const result = reconcile(
      [makeReversalTrx({ taxAmount: -25, chargeAmount: -400 })],
      [makeCalcSnap()],
      [makeOgTrxSnap()],
      NOW,
    );
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].errorType).toBe('reversal_disproportionate');
  });

  test('no error for proportional partial reversal within tolerance', () => {
    // original: tax=50, charge=1000 → ratio 0.05
    // reversal: tax=-25, charge=-500 → ratio 0.05 → diff = 0 → OK
    const result = reconcile(
      [makeReversalTrx({ taxAmount: -25, chargeAmount: -500 })],
      [makeCalcSnap()],
      [makeOgTrxSnap()],
      NOW,
    );
    expect(result.errors).toHaveLength(0);
  });

  test('ogChargeAmount === 0 short-circuits proportionality check', () => {
    // When original charge is 0, isProportional = true unconditionally
    const result = reconcile(
      [makeReversalTrx({ taxAmount: -25, chargeAmount: -999 })],
      [makeCalcSnap()],
      [makeOgTrxSnap({ chargeAmount: 0, taxAmount: 50 })],
      NOW,
    );
    // isNotOverOriginal: |-25| <= |50| → true; isProportional: short-circuit → true → no error
    expect(result.errors).toHaveLength(0);
  });

  test('accumulates totalTaxRefunded correctly', () => {
    const result = reconcile(
      [
        makeReversalTrx({ id: 'rev_1', taxAmount: -20, chargeAmount: -400 }),
        makeReversalTrx({ id: 'rev_2', taxAmount: -30, chargeAmount: -600 }),
      ],
      [makeCalcSnap()],
      [makeOgTrxSnap()],
      NOW,
    );
    expect(result.totalTaxRefunded).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// reconcile() — aggregations (byState, byTransactionType)
// ---------------------------------------------------------------------------

describe('reconcile — aggregations', () => {
  test('byState accumulates collected and refunded, computes net_liability', () => {
    const trx = makeTrx({ taxAmount: 50 });
    const rev = makeReversalTrx({ taxAmount: -20, chargeAmount: -400 });
    const result = reconcile(
      [trx, rev],
      [makeCalcSnap({ state: 'CA', value: 50, transactionTypes: ['new_business'] })],
      [makeOgTrxSnap()],
      NOW,
    );
    expect(result.byState['CA']).toEqual({
      collected: 50,
      refunded: 20,
      net_liability: 30,
    });
  });

  test('byState skips entries with no state', () => {
    const result = reconcile(
      [makeTrx()],
      [makeCalcSnap({ state: undefined })],
      [],
      NOW,
    );
    expect(Object.keys(result.byState)).toHaveLength(0);
  });

  test('byTransactionType accumulates across multiple types', () => {
    const result = reconcile(
      [makeTrx({ taxAmount: 100 })],
      [makeCalcSnap({ transactionTypes: ['new_business', 'renewal'], value: 100 })],
      [],
      NOW,
    );
    expect(result.byTransactionType['new_business']).toEqual({ collected: 100, refunded: 0 });
    expect(result.byTransactionType['renewal']).toEqual({ collected: 100, refunded: 0 });
  });

  test('empty input returns all zeroes and empty aggregations', () => {
    const result = reconcile([], [], [], NOW);
    expect(result.errors).toHaveLength(0);
    expect(result.totalTaxCollected).toBe(0);
    expect(result.totalTaxRefunded).toBe(0);
    expect(result.totalDiscrepancyAmount).toBe(0);
    expect(result.byState).toEqual({});
    expect(result.byTransactionType).toEqual({});
  });
});
