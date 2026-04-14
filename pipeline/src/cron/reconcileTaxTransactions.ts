import {
  TaxReconciliationConfig,
  taxReconciliationConfigDoc,
  taxReconciliationErrorsCollection,
  taxTransactionsCollection,
  type TaxCalc,
  type TaxReconciliationError,
  type TaxTransaction,
} from '@idemand/common';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { ScheduledEvent } from 'firebase-functions/scheduler';
import { getTable } from '../services/bigquery/ensureTables.js';
import { streamRows } from '../services/bigquery/streamRows.js';
import { publishReconciliationError } from '../services/pubsub/publishers.js';
import { getByIds } from '../utils/arrays.js';
import { bigqueryDataset } from '../utils/environmentVars.js';

function subDays(date: Date, days: number) {
  return new Date(date.getTime() - days * 24 * 60 * 60 * 1000);
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

export default async (_event: ScheduledEvent) => {
  const startMS = Date.now();
  const db = getFirestore();

  // Step 1 — Load config
  const taxRecConfigSnap = await taxReconciliationConfigDoc(db).get();
  const config = TaxReconciliationConfig.parse(taxRecConfigSnap.data() ?? {});

  // Step 2 — Fetch tax transactions in lookback window
  const taxTrxSnaps = await taxTransactionsCollection(db)
    .where(
      'taxDate',
      '>=',
      Timestamp.fromDate(subDays(new Date(), config.lookbackDays)),
    )
    .get();
  const taxTrxs = taxTrxSnaps.docs.map((snap) => ({
    ...snap.data(),
    id: snap.id,
  }));

  // Step 3 — Batch-fetch tax calculations
  const taxCalcIds = [
    ...new Set(
      taxTrxs.map((t) => t.taxCalcId).filter((id): id is string => id != null),
    ),
  ];
  const taxCalcSnaps = await getByIds<TaxCalc>(
    db,
    'taxCalculations',
    taxCalcIds,
  );

  // Step 4 — Batch-fetch original transactions needed for reversal checks
  const originalTrxIds = [
    ...new Set(
      taxTrxs
        .filter((t) => t.type === 'reversal')
        .map((t) => t.reversal?.originalTransactionId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const originalTrxSnaps = await getByIds<TaxTransaction>(
    db,
    'taxTransactions',
    originalTrxIds,
  );

  // Step 5 — Reconciliation loop: detect errors and build aggregations
  const reconciliationErrors: TaxReconciliationError[] = [];
  let totalTaxCollected = 0;
  let totalTaxRefunded = 0;
  let totalDiscrepancyAmount = 0;

  const byState: Record<
    string,
    { collected: number; refunded: number; net_liability: number }
  > = {};
  const byTransactionType: Record<
    string,
    { collected: number; refunded: number }
  > = {};

  const addToState = (
    state: string | null | undefined,
    collected: number,
    refunded: number,
  ) => {
    if (!state) return;
    byState[state] ??= { collected: 0, refunded: 0, net_liability: 0 };
    byState[state].collected = round(byState[state].collected + collected);
    byState[state].refunded = round(byState[state].refunded + refunded);
    byState[state].net_liability = round(
      byState[state].collected - byState[state].refunded,
    );
  };

  const addToTrxType = (
    types: string[] | null | undefined,
    collected: number,
    refunded: number,
  ) => {
    for (const type of types ?? []) {
      byTransactionType[type] ??= { collected: 0, refunded: 0 };
      byTransactionType[type].collected = round(
        byTransactionType[type].collected + collected,
      );
      byTransactionType[type].refunded = round(
        byTransactionType[type].refunded + refunded,
      );
    }
  };

  for (const t of taxTrxs) {
    const taxCalcSnap = taxCalcSnaps.find((c) => c.id === t.taxCalcId);

    if (t.type === 'transaction') {
      const actual = t.taxAmount ?? 0;
      const expected = taxCalcSnap?.data.value;

      totalTaxCollected = round(totalTaxCollected + actual);
      addToState(taxCalcSnap?.data.state, actual, 0);
      addToTrxType(taxCalcSnap?.data.transactionTypes, actual, 0);

      const isMissingCalc = !taxCalcSnap;
      const discrepancyAmount = round(actual - (expected ?? 0));
      const isAmountMismatch =
        !isMissingCalc &&
        Math.abs(discrepancyAmount) > Math.max(0.01, 0.001 * (expected ?? 0));

      if (isMissingCalc || isAmountMismatch) {
        totalDiscrepancyAmount = round(
          totalDiscrepancyAmount + Math.abs(discrepancyAmount),
        );
        reconciliationErrors.push({
          taxTransactionId: t.id,
          taxCalcId: taxCalcSnap?.id ?? null,
          policyId: t.policyId,
          errorType: isMissingCalc ? 'missing_tax_calc' : 'amount_mismatch',
          expectedAmount: expected ?? null,
          actualAmount: actual,
          deltaAmount: discrepancyAmount,
          taxId: t.taxId,
          state: taxCalcSnap?.data.state ?? null,
          detectedAt: Timestamp.now(),
          status: 'open',
          metadata: { created: Timestamp.now(), updated: Timestamp.now() },
        });
      }
    } else if (t.type === 'reversal') {
      const refundedAmt = Math.abs(t.taxAmount ?? 0);
      totalTaxRefunded = round(totalTaxRefunded + refundedAmt);
      addToState(taxCalcSnap?.data.state, 0, refundedAmt);
      addToTrxType(taxCalcSnap?.data.transactionTypes, 0, refundedAmt);

      // Verify refund does not exceed original and is proportional to charge refunded
      const ogTrx = originalTrxSnaps.find(
        (s) => s.id === t.reversal?.originalTransactionId,
      )?.data;

      const isNotOverOriginal =
        Math.abs(t.taxAmount ?? 0) <= Math.abs(ogTrx?.taxAmount ?? 0);
      const ogChargeAmount = ogTrx?.chargeAmount ?? 0;
      const isProportional =
        ogChargeAmount === 0 ||
        Math.abs(
          (t.taxAmount ?? 0) / (ogTrx?.taxAmount ?? 1) -
            (t.chargeAmount ?? 0) / ogChargeAmount,
        ) <= 0.01;

      if (!isNotOverOriginal || !isProportional) {
        const deltaAmount = round(
          (t.taxAmount ?? 0) - (ogTrx?.taxAmount ?? 0),
        );
        totalDiscrepancyAmount = round(
          totalDiscrepancyAmount + Math.abs(deltaAmount),
        );
        reconciliationErrors.push({
          taxTransactionId: t.id,
          taxCalcId: taxCalcSnap?.id ?? null,
          policyId: t.policyId,
          errorType: !isNotOverOriginal
            ? 'reversal_exceeds_original'
            : 'reversal_disproportionate',
          expectedAmount: ogTrx?.taxAmount ?? null,
          actualAmount: t.taxAmount ?? 0,
          deltaAmount,
          taxId: t.taxId,
          state: taxCalcSnap?.data.state ?? null,
          detectedAt: Timestamp.now(),
          status: 'open',
          metadata: { created: Timestamp.now(), updated: Timestamp.now() },
        });
      }
    }
  }

  // Step 5a — Write errors to Firestore
  if (reconciliationErrors.length) {
    const batch = db.batch();
    const col = taxReconciliationErrorsCollection(db);
    for (const r of reconciliationErrors) {
      batch.create(col.doc(), r);
    }
    await batch.commit();
  }

  // Step 5b — Stream report to BQ
  const reportDate = new Date().toISOString().slice(0, 10);
  const reportId = `${reportDate}_${startMS}`;

  const bqRow = {
    report_id: reportId,
    report_date: reportDate,
    total_tax_collected: totalTaxCollected,
    total_tax_refunded: totalTaxRefunded,
    net_tax_liability: round(totalTaxCollected - totalTaxRefunded),
    by_state_json: JSON.stringify(byState),
    by_transaction_type_json: JSON.stringify(byTransactionType),
    discrepancy_count: reconciliationErrors.length,
    total_discrepancy_amount: totalDiscrepancyAmount,
    processed_count: taxTrxs.length,
    lookback_days: config.lookbackDays,
    generated_at: new Date().toISOString(),
  };

  const taxReconciliationTable = await getTable(
    bigqueryDataset.value(),
    'tax_reconciliation_reports',
  );
  await streamRows(taxReconciliationTable, [bqRow], (r) => r.report_id);

  // Step 5c — Update config with lastRunAt for auditing
  await taxReconciliationConfigDoc(db).set(
    { lastRunAt: Timestamp.now() },
    { merge: true },
  );

  // step 6 - Alerting
  if (reconciliationErrors.length) {
    await publishReconciliationError({ reportId });
  }
};
