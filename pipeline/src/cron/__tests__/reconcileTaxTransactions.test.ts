// Integration tests for the reconcileTaxTransactions cron handler.
// Uses jest.unstable_mockModule + dynamic imports (required for ESM mocking).
// jest must be imported from @jest/globals so it's available at module scope (ESM mode).
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import type { ScheduledEvent } from 'firebase-functions/scheduler';

// ---------------------------------------------------------------------------
// Mock state — defined at module scope, populated lazily in beforeAll
// ---------------------------------------------------------------------------

// All mocks cast to jest.Mock<any> so .mockResolvedValue / .mockImplementation
// don't error under the stricter @jest/globals types.
const fn = () => jest.fn() as jest.Mock<any>;

const mockBatch = {
  create: fn(),
  commit: fn().mockResolvedValue(undefined),
};

const mockConfigDoc = {
  get: fn(),
  set: fn().mockResolvedValue(undefined),
};

const mockTaxTrxCollection = { where: fn() };
const mockErrorsCollection = { doc: fn().mockReturnValue({}) };

const mockDb = {
  batch: fn().mockReturnValue(mockBatch),
  collection: fn(),
  getAll: fn(),
};

const NOW = { seconds: 1713139200, nanoseconds: 0 };

const mockStreamRows = fn().mockResolvedValue(undefined);
const mockGetTable = fn().mockResolvedValue({ id: 'tax_reconciliation_reports' });
const mockPublishReconciliationError = fn().mockResolvedValue(undefined);
const mockGetByIds = fn();

// ---------------------------------------------------------------------------
// Module mocks — must be set up before dynamic import of the handler
// ---------------------------------------------------------------------------

await (jest as any).unstable_mockModule('@idemand/common', () => ({
  TaxReconciliationConfig: { parse: jest.fn((v: any) => ({ lookbackDays: 7, ...v })) },
  taxReconciliationConfigDoc: jest.fn(() => mockConfigDoc),
  taxReconciliationErrorsCollection: jest.fn(() => mockErrorsCollection),
  taxTransactionsCollection: jest.fn(() => mockTaxTrxCollection),
}));

await (jest as any).unstable_mockModule('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => mockDb),
  Timestamp: {
    now: jest.fn(() => NOW),
    fromDate: jest.fn((d: Date) => ({ seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 })),
  },
}));

await (jest as any).unstable_mockModule('../../services/bigquery/ensureTables.js', () => ({
  getTable: mockGetTable,
}));

await (jest as any).unstable_mockModule('../../services/bigquery/streamRows.js', () => ({
  streamRows: mockStreamRows,
}));

await (jest as any).unstable_mockModule('../../services/pubsub/publishers.js', () => ({
  publishReconciliationError: mockPublishReconciliationError,
}));

await (jest as any).unstable_mockModule('../../utils/arrays.js', () => ({
  getByIds: mockGetByIds,
}));

await (jest as any).unstable_mockModule('../../utils/environmentVars.js', () => ({
  bigqueryDataset: { value: jest.fn(() => 'test_dataset') },
}));

// Dynamic import AFTER mocks are registered
const { default: handler } = await import('../reconcileTaxTransactions.js') as { default: (e: ScheduledEvent) => Promise<void> };

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const FAKE_EVENT = {} as ScheduledEvent;

function makeDocSnap(id: string, data: Record<string, any>) {
  return { id, data: () => data };
}

function makeQuerySnap(docs: ReturnType<typeof makeDocSnap>[]) {
  return { docs };
}

function setupCleanRun() {
  mockConfigDoc.get.mockResolvedValue({ data: () => ({ lookbackDays: 7 }) });

  const trxSnap = makeDocSnap('trx_1', {
    type: 'transaction',
    taxId: 'tax_1',
    taxCalcId: 'calc_1',
    policyId: 'pol_1',
    chargeAmount: 1000,
    taxAmount: 50,
    reversal: null,
  });
  mockTaxTrxCollection.where.mockReturnValue({
    get: fn().mockResolvedValue(makeQuerySnap([trxSnap])),
  });

  mockGetByIds.mockImplementation((_db: any, collection: any) => {
    if (collection === 'taxCalculations') {
      return Promise.resolve([
        { id: 'calc_1', data: { value: 50, state: 'CA', transactionTypes: ['new_business'] } },
      ]);
    }
    return Promise.resolve([]);
  });
}

function setupErrorRun() {
  mockConfigDoc.get.mockResolvedValue({ data: () => ({ lookbackDays: 7 }) });

  const trxSnap = makeDocSnap('trx_1', {
    type: 'transaction',
    taxId: 'tax_1',
    taxCalcId: 'calc_1',
    policyId: 'pol_1',
    chargeAmount: 1000,
    taxAmount: 60, // expected 50 → delta 10 exceeds threshold
    reversal: null,
  });
  mockTaxTrxCollection.where.mockReturnValue({
    get: fn().mockResolvedValue(makeQuerySnap([trxSnap])),
  });

  mockGetByIds.mockImplementation((_db: any, collection: any) => {
    if (collection === 'taxCalculations') {
      return Promise.resolve([
        { id: 'calc_1', data: { value: 50, state: 'CA', transactionTypes: ['new_business'] } },
      ]);
    }
    return Promise.resolve([]);
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks();
  // Re-apply stable resolved values cleared by clearAllMocks
  mockBatch.commit.mockResolvedValue(undefined);
  mockConfigDoc.set.mockResolvedValue(undefined);
  mockStreamRows.mockResolvedValue(undefined);
  mockGetTable.mockResolvedValue({ id: 'tax_reconciliation_reports' });
  mockPublishReconciliationError.mockResolvedValue(undefined);
});

describe('reconcileTaxTransactions handler — clean run', () => {
  test('streams a BQ row with correct totals', async () => {
    setupCleanRun();
    await handler(FAKE_EVENT);

    expect(mockStreamRows).toHaveBeenCalledTimes(1);
    const [, rows] = mockStreamRows.mock.calls[0] as [any, any[]];
    const row = rows[0];
    expect(row.total_tax_collected).toBe(50);
    expect(row.total_tax_refunded).toBe(0);
    expect(row.net_tax_liability).toBe(50);
    expect(row.discrepancy_count).toBe(0);
    expect(row.processed_count).toBe(1);
    expect(row.lookback_days).toBe(7);
  });

  test('does NOT write Firestore error batch on clean run', async () => {
    setupCleanRun();
    await handler(FAKE_EVENT);

    expect(mockBatch.commit).not.toHaveBeenCalled();
  });

  test('does NOT publish a reconciliation error alert on clean run', async () => {
    setupCleanRun();
    await handler(FAKE_EVENT);

    expect(mockPublishReconciliationError).not.toHaveBeenCalled();
  });

  test('updates config lastRunAt', async () => {
    setupCleanRun();
    await handler(FAKE_EVENT);

    expect(mockConfigDoc.set).toHaveBeenCalledWith(
      expect.objectContaining({ lastRunAt: expect.anything() }),
      { merge: true },
    );
  });
});

describe('reconcileTaxTransactions handler — error run', () => {
  test('writes errors to Firestore batch', async () => {
    setupErrorRun();
    await handler(FAKE_EVENT);

    expect(mockBatch.create).toHaveBeenCalledTimes(1);
    expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    const [, errorDoc] = mockBatch.create.mock.calls[0] as [any, any];
    expect(errorDoc.errorType).toBe('amount_mismatch');
    expect(errorDoc.taxTransactionId).toBe('trx_1');
  });

  test('streams BQ row with non-zero discrepancy_count', async () => {
    setupErrorRun();
    await handler(FAKE_EVENT);

    const [, rows] = mockStreamRows.mock.calls[0] as [any, any[]];
    expect(rows[0].discrepancy_count).toBe(1);
    expect(rows[0].total_discrepancy_amount).toBe(10);
  });

  test('publishes reconciliation error alert with reportId', async () => {
    setupErrorRun();
    await handler(FAKE_EVENT);

    expect(mockPublishReconciliationError).toHaveBeenCalledTimes(1);
    const call = mockPublishReconciliationError.mock.calls[0] as [{ reportId: string }];
    const { reportId } = call[0];
    expect(typeof reportId).toBe('string');
    expect(reportId.length).toBeGreaterThan(0);
  });
});

describe('reconcileTaxTransactions handler — empty window', () => {
  test('streams a BQ row with all-zero counts when no transactions exist', async () => {
    mockConfigDoc.get.mockResolvedValue({ data: () => ({ lookbackDays: 7 }) });
    mockTaxTrxCollection.where.mockReturnValue({
      get: fn().mockResolvedValue(makeQuerySnap([])),
    });
    mockGetByIds.mockResolvedValue([]);

    await handler(FAKE_EVENT);

    expect(mockStreamRows).toHaveBeenCalledTimes(1);
    const [, rows] = mockStreamRows.mock.calls[0] as [any, any[]];
    expect(rows[0].total_tax_collected).toBe(0);
    expect(rows[0].discrepancy_count).toBe(0);
    expect(rows[0].processed_count).toBe(0);
    expect(mockBatch.commit).not.toHaveBeenCalled();
    expect(mockPublishReconciliationError).not.toHaveBeenCalled();
  });
});
