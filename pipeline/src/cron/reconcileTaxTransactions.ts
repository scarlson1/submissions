import {
  TaxReconciliationConfig,
  taxReconciliationConfigDoc,
  taxReconciliationErrorsCollection,
  taxTransactionsCollection,
  type TaxCalc,
  type TaxTransaction,
} from '@idemand/common';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import type { ScheduledEvent } from 'firebase-functions/scheduler';
import { getTable } from '../services/bigquery/ensureTables.js';
import { streamRows } from '../services/bigquery/streamRows.js';
import { publishReconciliationError } from '../services/pubsub/publishers.js';
import { getByIds } from '../utils/arrays.js';
import { bigqueryDataset } from '../utils/environmentVars.js';
import { reconcile, subDays } from './reconcileTaxTransactions.logic.js';

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
  const taxCalcSnaps = await getByIds<TaxCalc>(db, 'taxCalculations', taxCalcIds);

  // Step 4 — Batch-fetch original transactions needed for reversal checks
  const originalTrxIds = [
    ...new Set(
      taxTrxs
        .filter((t) => t.type === 'reversal')
        .map((t) => t.reversal?.originalTransactionId)
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const originalTrxSnaps = await getByIds<TaxTransaction>(db, 'taxTransactions', originalTrxIds);

  // Step 5 — Reconciliation loop: detect errors and build aggregations
  const now = Timestamp.now();
  const {
    errors: reconciliationErrors,
    totalTaxCollected,
    totalTaxRefunded,
    totalDiscrepancyAmount,
    byState,
    byTransactionType,
  } = reconcile(taxTrxs as any, taxCalcSnaps, originalTrxSnaps, now);

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
    net_tax_liability: Math.round((totalTaxCollected - totalTaxRefunded) * 100) / 100,
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

  // Step 6 — Alerting
  if (reconciliationErrors.length) {
    await publishReconciliationError({ reportId });
  }
};
