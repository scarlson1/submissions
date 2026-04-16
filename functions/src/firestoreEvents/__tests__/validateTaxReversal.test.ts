/**
 * Unit tests for validateTaxReversal Firestore trigger.
 *
 * Uses jest.unstable_mockModule (ESM-safe) to replace firebase-admin/firestore
 * and @idemand/common with lightweight stubs, then dynamically imports the
 * handler after mocks are registered.
 *
 * jest must be imported from @jest/globals so it's available at module scope
 * in ESM / --experimental-vm-modules mode.
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';

// ── Mock state ───────────────────────────────────────────────────────────────

const fn = () => jest.fn() as jest.Mock<any>;

const mockErrorDoc = { set: fn().mockResolvedValue(undefined) };
const mockErrorsCollection = { doc: fn().mockReturnValue(mockErrorDoc) };
const mockOgSnap = { exists: true, data: fn() };
const mockTaxTrxDoc = { get: fn().mockResolvedValue(mockOgSnap) };
const mockTaxTrxCollection = { doc: fn().mockReturnValue(mockTaxTrxDoc) };
const mockDb = {};
const NOW = { seconds: 1_700_000_000, nanoseconds: 0 };

// ── Module mocks (must be set before dynamic import) ─────────────────────────

await (jest as any).unstable_mockModule('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => mockDb),
  Timestamp: {
    now: jest.fn(() => NOW),
    fromDate: jest.fn((d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 })),
  },
}));

await (jest as any).unstable_mockModule('@idemand/common', () => ({
  TaxReversalTransaction: {
    safeParse: jest.fn((data: any) => ({ success: true, data })),
  },
  taxTransactionsCollection: jest.fn(() => mockTaxTrxCollection),
  taxReconciliationErrorsCollection: jest.fn(() => mockErrorsCollection),
}));

// Stub out Sentry / logger dependencies loaded transitively
await (jest as any).unstable_mockModule('firebase-functions/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

await (jest as any).unstable_mockModule('../../common/index.js', () => ({
  getReportErrorFn: jest.fn(() => jest.fn()),
}));

// Dynamic import AFTER mocks are registered
const { default: handler } = (await import('../validateTaxReversal.js')) as {
  default: (e: FirestoreEvent<QueryDocumentSnapshot | undefined, { transactionId: string }>) => Promise<void>;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeEvent(data: Record<string, any> | null) {
  return {
    params: { transactionId: 'trx_test' },
    data: data
      ? { data: () => data }
      : undefined,
  } as unknown as FirestoreEvent<QueryDocumentSnapshot | undefined, { transactionId: string }>;
}

const makeReversal = (overrides: Record<string, any> = {}) => ({
  type: 'reversal',
  taxId: 'tax_1',
  taxCalcId: 'calc_1',
  policyId: 'pol_1',
  taxAmount: -50,
  chargeAmount: -1000,
  reversal: { originalTransactionId: 'og_trx_1' },
  ...overrides,
});

const makeOgTrx = (overrides: Record<string, any> = {}) => ({
  taxAmount: 50,
  chargeAmount: 1000,
  ...overrides,
});

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mockErrorDoc.set.mockResolvedValue(undefined);
  mockOgSnap.exists = true;
  mockOgSnap.data.mockReturnValue(makeOgTrx());
  mockTaxTrxDoc.get.mockResolvedValue(mockOgSnap);
  mockErrorsCollection.doc.mockReturnValue(mockErrorDoc);
});

describe('validateTaxReversal — skips non-reversal events', () => {
  test('returns early when event data is absent', async () => {
    await handler(makeEvent(null));
    expect(mockErrorDoc.set).not.toHaveBeenCalled();
  });

  test('returns early when type is not "reversal"', async () => {
    await handler(makeEvent({ type: 'transaction' }));
    expect(mockErrorDoc.set).not.toHaveBeenCalled();
  });
});

describe('validateTaxReversal — valid reversal', () => {
  test('does not write an error doc when reversal is proportional and within original', async () => {
    mockOgSnap.data.mockReturnValue(makeOgTrx({ taxAmount: 50, chargeAmount: 1000 }));
    await handler(makeEvent(makeReversal({ taxAmount: -50, chargeAmount: -1000 })));
    expect(mockErrorDoc.set).not.toHaveBeenCalled();
  });

  test('allows small proportionality rounding (within 1% tolerance)', async () => {
    // reversal is 99.5% of original — within the 0.01 threshold
    mockOgSnap.data.mockReturnValue(makeOgTrx({ taxAmount: 100, chargeAmount: 1000 }));
    await handler(makeEvent(makeReversal({ taxAmount: -99.6, chargeAmount: -996 })));
    expect(mockErrorDoc.set).not.toHaveBeenCalled();
  });
});

describe('validateTaxReversal — invalid reversal', () => {
  test('writes error doc when reversal exceeds original tax amount', async () => {
    mockOgSnap.data.mockReturnValue(makeOgTrx({ taxAmount: 50, chargeAmount: 1000 }));
    await handler(makeEvent(makeReversal({ taxAmount: -60, chargeAmount: -1000 })));
    expect(mockErrorDoc.set).toHaveBeenCalledTimes(1);
    const [errorPayload] = mockErrorDoc.set.mock.calls[0] as [any];
    expect(errorPayload.errorType).toBe('reversal_exceeds_original');
    expect(errorPayload.taxTransactionId).toBe('trx_test');
  });

  test('writes error doc when reversal is disproportionate to charge amount', async () => {
    // taxAmount ratio: 25/50 = 0.5, chargeAmount ratio: 500/1000 = 0.5 → ok
    // taxAmount ratio: 25/50 = 0.5, chargeAmount ratio: 200/1000 = 0.2 → disproportionate
    mockOgSnap.data.mockReturnValue(makeOgTrx({ taxAmount: 50, chargeAmount: 1000 }));
    await handler(makeEvent(makeReversal({ taxAmount: -25, chargeAmount: -200 })));
    expect(mockErrorDoc.set).toHaveBeenCalledTimes(1);
    const [errorPayload] = mockErrorDoc.set.mock.calls[0] as [any];
    expect(errorPayload.errorType).toBe('reversal_disproportionate');
  });

  test('error doc contains expected fields', async () => {
    mockOgSnap.data.mockReturnValue(makeOgTrx({ taxAmount: 50 }));
    await handler(makeEvent(makeReversal({ taxAmount: -75, chargeAmount: -1000 })));
    const [payload] = mockErrorDoc.set.mock.calls[0] as [any];
    expect(payload).toMatchObject({
      taxTransactionId: 'trx_test',
      policyId: 'pol_1',
      taxId: 'tax_1',
      status: 'open',
      expectedAmount: 50,
    });
  });
});

describe('validateTaxReversal — missing original transaction', () => {
  test('does not write error doc when original transaction is not found', async () => {
    mockOgSnap.exists = false;
    await handler(makeEvent(makeReversal()));
    expect(mockErrorDoc.set).not.toHaveBeenCalled();
  });
});
