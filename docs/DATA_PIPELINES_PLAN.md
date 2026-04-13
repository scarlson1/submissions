# Data Pipelines Implementation Plan

## Overview

This document is a step-by-step implementation plan for four data pipeline initiatives, prioritized by business value and standalone-ness. Because Pipelines 1, 3, and 4 share a BigQuery CDC foundation, they are built in a deliberate order:

1. **Phase 0 — Shared BQ Infrastructure** (prereq for 1, 3, 4)
2. **Phase 1 — Portfolio Aggregation & Exposure** (Pipeline 2 — most standalone, most interesting geospatially)
3. **Phase 2 — Firestore → BigQuery CDC Layer** (Pipeline 1 foundation)
4. **Phase 3 — Tax Reconciliation** (Pipeline 3 — builds on Phase 0 + BQ sink from Phase 2)
5. **Phase 4 — Agent Performance & Funnel Analytics** (Pipeline 4 — BQ transforms on Phase 2 tables)

---

## Phase 0: Shared BigQuery Infrastructure

> All BQ-touching pipelines need a consistent client, schema registry, and table-management layer. Build this once.

### 0.1 — Install dependency

```bash
cd functions && pnpm add @google-cloud/bigquery
```

The service account attached to Cloud Functions already has BQ access in GCP; no extra secret is needed.

### 0.2 — BigQuery client service

**New file:** `functions/src/services/bigquery/client.ts`

- Export a lazily-initialized `BigQuery` instance (same pattern as the Typesense client).
- Accept `projectId` from `projectID` Firebase param.
- Export a `getDataset(datasetId: string)` helper that creates-or-gets the dataset.

### 0.3 — Schema definitions

**New file:** `functions/src/services/bigquery/schemas.ts`

Define `TableSchema[]` for every table that will be created across all pipelines:

| Table | Partition column | Cluster columns |
|---|---|---|
| `policies` | `effective_date` | `home_state`, `product`, `payment_status` |
| `policy_locations` | `effective_date` | `state`, `flood_zone`, `county_fips` |
| `transactions` | `created_at` | `transaction_type`, `policy_id` |
| `submissions` | `created_at` | `home_state`, `status` |
| `quotes` | `created_at` | `home_state`, `submission_id` |
| `tax_transactions` | `tax_date` | `state`, `tax_id`, `type` |
| `tax_calculations` | `calc_date` | `state`, `tax_id` |
| `portfolio_exposure` | `computed_at` | `state`, `flood_zone`, `county_fips` |
| `portfolio_concentration_alerts` | `detected_at` | `state`, `flood_zone` |
| `tax_reconciliation_reports` | `report_date` | `state`, `transaction_type` |

All tables use `DATE`-range partitioning with a 90-day partition expiry on dev and no expiry on prod.

### 0.4 — Table provisioning function

**New file:** `functions/src/services/bigquery/ensureTables.ts`

- `ensureTables(datasetId, tables)` — idempotent create-or-update for each table schema.
- Call from an HTTP-triggered admin function (like `typesenseSetup`) so tables can be re-provisioned after schema evolution without a redeployment.

**New file:** `functions/src/routes/bigquerySetup.ts` + wire into `functions/src/routes/index.ts`
- Protected by `requireClaim(['iDemandAdmin'])`, matching the existing Typesense setup route pattern.

### 0.5 — Row transform utilities

**New file:** `functions/src/services/bigquery/transforms.ts`

Reusable helpers that convert Firestore `Timestamp` → ISO string, `GeoPoint` → lat/lng pair, nested records → flattened JSON string (for BQ `STRING` columns), and `null`-safe primitives. These are used by every CDC trigger in Phase 2.

### 0.6 — `streamRows` helper

**New file:** `functions/src/services/bigquery/streamRows.ts`

```typescript
export async function streamRows<T>(
  tableRef: Table,
  rows: T[],
  insertIdFn: (row: T) => string,
): Promise<void>
```

- Wraps `table.insert(rows, { raw: false })` with the `insertId` set per row for BQ's at-least-once deduplication window (1 minute).
- Logs and re-throws on error so callers can decide to swallow or alert.

### 0.7 — `common/` additions

**Modify:** `common/src/enums.ts` — add new `Collection` enum values:

```typescript
'portfolioExposure',
'portfolioConcentrationAlerts',
'taxReconciliationErrors',
'exposureConfig',
```

---

## Phase 1: Portfolio Aggregation & Exposure Pipeline

> A scheduled batch job that reads all active policy locations, buckets them geospatially, computes exposure metrics, detects concentration risk, and writes both a live Firestore read-model and a historical BigQuery table.

### Why this first

This pipeline is the most standalone (doesn't need Phase 2 CDC), has the most interesting data engineering components (collection group query, geohash bucketing, change detection, concentration alerting), and directly creates a user-visible feature that doesn't currently exist.

### 1.1 — Types

**New file:** `common/src/types/portfolioExposure.ts`

```typescript
export const ExposureBucket = z.object({
  bucketId: z.string(),           // "{state}#{countyFips}#{floodZone}#{geohashPrefix}"
  state: State,
  countyFips: z.string().nullable(),
  countyName: z.string().nullable(),
  floodZone: FloodZone,
  geohashPrefix: z.string(),      // first 5 chars → ~5km² cells
  locationCount: z.number().int().nonnegative(),
  totalInsuredValue: z.number().nonnegative(),
  totalTermPremium: z.number().nonnegative(),
  avgDeductible: z.number().nonnegative(),
  policyIds: z.array(z.string()),
  computedAt: Timestamp,
});
export type ExposureBucket = z.infer<typeof ExposureBucket>;

export const ExposureSnapshot = z.object({
  snapshotDate: z.string(),       // "YYYY-MM-DD"
  totalLocationCount: z.number().int(),
  totalInsuredValue: z.number(),
  totalTermPremium: z.number(),
  bucketCount: z.number().int(),
  computedAt: Timestamp,
  computedBy: z.string(),         // function name + invocation ID for traceability
});
export type ExposureSnapshot = z.infer<typeof ExposureSnapshot>;

export const ConcentrationAlert = z.object({
  bucketId: z.string(),
  state: State,
  countyFips: z.string().nullable(),
  floodZone: FloodZone,
  geohashPrefix: z.string(),
  alertType: z.enum(['absolute_tiv', 'week_over_week_shift']),
  currentTiv: z.number(),
  thresholdTiv: z.number().nullable(),
  previousTiv: z.number().nullable(),
  shiftPct: z.number().nullable(),
  detectedAt: Timestamp,
  resolvedAt: Timestamp.nullable().optional(),
  status: z.enum(['active', 'resolved', 'acknowledged']),
});
export type ConcentrationAlert = z.infer<typeof ConcentrationAlert>;

export const ExposureConfig = z.object({
  absoluteTivThreshold: z.number().default(50_000_000),   // $50M
  weekOverWeekShiftPctThreshold: z.number().default(0.15), // 15%
  geohashPrecision: z.number().int().min(1).max(9).default(5),
});
export type ExposureConfig = z.infer<typeof ExposureConfig>;
```

Export from `common/src/types/index.ts`.

### 1.2 — Firestore collection helpers

**Modify:** `functions/src/common/dbCollections.ts` — add:

```typescript
export const portfolioExposureBucketsCollection = (db: Firestore) =>
  createCollection<ExposureBucket>(db, `portfolioExposure/current/buckets`);

export const portfolioExposureSnapshotCollection = (db: Firestore) =>
  createCollection<ExposureSnapshot>(db, `portfolioExposure/snapshots`);

export const concentrationAlertsCollection = (db: Firestore) =>
  createCollection<ConcentrationAlert>(db, Collection.enum.portfolioConcentrationAlerts);

export const exposureConfigDoc = (db: Firestore) =>
  db.collection(Collection.enum.exposureConfig).doc('default');
```

### 1.3 — Core pipeline logic

**New file:** `functions/src/scheduler/computePortfolioExposure.ts`

This is the main implementation file. Key sections:

**Step 1 — Read config**
- Fetch `exposureConfig/default` from Firestore. Fall back to `ExposureConfig` defaults if not set.
- Ensures operators can tune thresholds without a redeployment.

**Step 2 — Load all active policy locations via collection group query**
```typescript
const db = getFirestore();
const snap = await db
  .collectionGroup(Collection.enum.locations)
  .where('parentType', '==', 'policy')
  .where('cancelEffDate', '==', null)
  .get();
```
This is the correct and efficient approach — `collectionGroup` spans the flat `locations` collection rather than joining through policies.

> **Firestore index required:** A composite index on `(parentType ASC, cancelEffDate ASC)` for the `locations` collection group. Add to `firestore.indexes.json`.

**Step 3 — Bucket construction**
```typescript
const BUCKET_DELIMITER = '#';

function buildBucketId(loc: ILocationPolicy, geohashPrecision: number): string {
  const prefix = loc.geoHash.slice(0, geohashPrecision);
  const fips = loc.address.countyFIPS ?? 'unknown';
  return [loc.address.state, fips, loc.ratingPropertyData.floodZone, prefix]
    .join(BUCKET_DELIMITER);
}
```

The `geoHash` field is already computed and stored on every `BaseLocation`, so no external library call is needed at aggregation time.

**Step 4 — Aggregation loop**

Iterate location docs, call `buildBucketId`, and accumulate into a `Map<string, ExposureBucket>`:

```typescript
const buckets = new Map<string, MutableBucket>();

for (const doc of snap.docs) {
  const loc = doc.data() as ILocationPolicy;
  const bucketId = buildBucketId(loc, config.geohashPrecision);
  const existing = buckets.get(bucketId) ?? newEmptyBucket(bucketId, loc);
  existing.locationCount++;
  existing.totalInsuredValue += loc.TIV;
  existing.totalTermPremium += loc.termPremium;
  existing.avgDeductible = rollingAvg(existing.avgDeductible, loc.deductible, existing.locationCount);
  existing.policyIds = [...new Set([...existing.policyIds, loc.policyId])];
  buckets.set(bucketId, existing);
}
```

**Step 5 — Firestore writes (batched)**

Write all buckets to `portfolioExposure/current/buckets/{bucketId}` using Firestore batched writes (max 500 ops per batch, chunked with the existing `splitChunks` utility).

Also write an `ExposureSnapshot` to `portfolioExposure/snapshots/{YYYY-MM-DD}`.

Use `set(..., { merge: false })` (full overwrite) so stale buckets for cancelled policies are cleared on each run.

**Step 6 — BigQuery write**

Stream all bucket rows to the `portfolio_exposure` BQ table using `streamRows()` from Phase 0. The `computedAt` date drives partition routing. Use `bucketId + snapshotDate` as the `insertId` for deduplication.

**Step 7 — Change detection**

Load the previous day's snapshot from Firestore (`portfolioExposure/snapshots/{yesterday}`):
- Compare bucket-level TIV totals. If `|current - previous| / previous > weekOverWeekShiftPctThreshold`, create a `ConcentrationAlert` with `alertType: 'week_over_week_shift'`.
- For any bucket where `totalInsuredValue > absoluteTivThreshold`, create an `alertType: 'absolute_tiv'` alert.

Resolve previously active alerts whose bucket TIV has dropped below threshold.

Write alerts to `portfolioConcentrationAlerts/{alertId}` and stream to BQ `portfolio_concentration_alerts`.

**Step 8 — Summary log**

Log a structured summary (locationCount, bucketCount, totalTIV, alertsRaised, alertsResolved, durationMs) via `firebase-functions/logger` for Cloud Logging dashboards.

### 1.4 — Scheduler registration

**Modify:** `functions/src/scheduler/index.ts` — add:

```typescript
export const computeportfolioexposure = onSchedule(
  { schedule: '0 2 * * *', timeZone: 'America/New_York' },
  async (event) => {
    await (await import('./computePortfolioExposure.js')).default(event);
  },
);
```

Runs daily at 2 AM ET (off-peak, after business hours).

### 1.5 — Manual trigger callable

**New file:** `functions/src/callables/triggerPortfolioExposure.ts`

- Protected by `requireClaim(['iDemandAdmin'])`.
- Accepts an optional `{ snapshotDate?: string }` param for backfill support.
- Calls the same core logic as the scheduler.
- Returns `{ bucketCount, totalTiv, alertsRaised }` for admin visibility.

**Modify:** `functions/src/callables/index.ts` — wire it in.

### 1.6 — Firestore index

**Modify:** `firestore.indexes.json` — add collection group index:

```json
{
  "collectionGroup": "locations",
  "queryScope": "COLLECTION_GROUP",
  "fields": [
    { "fieldPath": "parentType", "order": "ASCENDING" },
    { "fieldPath": "cancelEffDate", "order": "ASCENDING" }
  ]
}
```

### 1.7 — Firestore rules

**Modify:** `firestore.rules` — add read rules for portfolio collections:
- `portfolioExposure/**`: readable by `iDemandAdmin` and `iDemandUser`.
- `portfolioConcentrationAlerts`: readable by `iDemandAdmin`.
- `exposureConfig/default`: readable by `iDemandAdmin`; writable only by `iDemandAdmin`.

---

## Phase 2: Firestore → BigQuery CDC Layer

> A set of `onDocumentWritten` Firestore triggers that stream normalized rows to BigQuery on every create/update/delete. This is the foundation for Pipelines 1 (premium analytics), 3 (tax reconciliation), and 4 (funnel analytics).

### Design decisions

**Trigger-based vs. export-based**: A Cloud Storage export (managed Firestore export → BQ) runs daily and requires significant orchestration. Trigger-based CDC gives near-real-time freshness with existing infrastructure patterns (same `onDocumentWritten` approach used throughout the codebase).

**Schema normalization strategy**: Firestore documents have nested objects and arrays that don't map cleanly to BQ flat tables. The approach:
- Scalar fields → native BQ columns.
- Nested objects (`namedInsured`, `agent`, `agency`) → `RECORD` (STRUCT) columns in BQ.
- Arrays of uniform objects (`taxes`, `fees`) → `REPEATED RECORD` columns.
- The `locations` record on `Policy` is normalized into a separate `policy_locations` table, with `policyId` as the join key.
- Firestore `Timestamp` → BQ `TIMESTAMP` (via `.toDate().toISOString()`).
- Firestore `GeoPoint` → two separate `FLOAT64` columns (`latitude`, `longitude`).

**Deduplication**: BQ streaming inserts have a ~1-minute deduplication window using `insertId`. For longer-term deduplication, each table has a `_doc_version` column (from `metadata.version`). Downstream queries should use `QUALIFY ROW_NUMBER() OVER (PARTITION BY id ORDER BY _doc_version DESC) = 1` to get the latest row. A scheduled BQ job or materialized view handles this dedup layer for analytics use.

**Deletes**: Write a row with `_deleted = TRUE` and `_doc_version` incremented. Downstream queries filter `WHERE NOT _deleted`.

### 2.1 — Row transform modules

**New directory:** `functions/src/services/bigquery/rowTransforms/`

**New file:** `functions/src/services/bigquery/rowTransforms/policy.ts`
- `policyToRow(id: string, data: Policy, deleted = false): PolicyBQRow`
- `policyLocationToRow(policyId: string, lcnId: string, data: PolicyLocation, deleted = false): PolicyLocationBQRow`

**New file:** `functions/src/services/bigquery/rowTransforms/transaction.ts`
- `transactionToRow(id: string, data: Transaction, deleted = false): TransactionBQRow`

**New file:** `functions/src/services/bigquery/rowTransforms/submission.ts`
- `submissionToRow(id: string, data: Submission, deleted = false): SubmissionBQRow`

**New file:** `functions/src/services/bigquery/rowTransforms/quote.ts`
- `quoteToRow(id: string, data: Quote, deleted = false): QuoteBQRow`

**New file:** `functions/src/services/bigquery/rowTransforms/taxTransaction.ts`
- `taxTransactionToRow(id: string, data: TaxTransaction, deleted = false): TaxTransactionBQRow`

**New file:** `functions/src/services/bigquery/rowTransforms/taxCalculation.ts`
- `taxCalcToRow(id: string, data: TaxCalc, deleted = false): TaxCalcBQRow`

Each transform is a pure function (easy to unit test) that handles all type narrowing and null-safety before rows touch BigQuery.

### 2.2 — CDC trigger implementations

**New directory:** `functions/src/firestoreEvents/bigquery/`

**New file:** `functions/src/firestoreEvents/bigquery/syncPolicyToBQ.ts`
```typescript
export default async (
  event: FirestoreEvent<Change<DocumentSnapshot> | undefined, { policyId: string }>
) => {
  const { policyId } = event.params;
  const isDelete = !event.data?.after?.exists;
  const data = (isDelete ? event.data?.before : event.data?.after)?.data() as Policy | undefined;
  if (!data) return;

  const policyRow = policyToRow(policyId, data, isDelete);
  const locationRows = Object.entries(data.locations).map(([lcnId, lcn]) =>
    policyLocationToRow(policyId, lcnId, lcn, isDelete),
  );

  const [policyTable, locationTable] = await Promise.all([
    getTable(DATASET_ID, 'policies'),
    getTable(DATASET_ID, 'policy_locations'),
  ]);

  await Promise.all([
    streamRows(policyTable, [policyRow], (r) => `${r.id}_${r._doc_version}`),
    locationRows.length
      ? streamRows(locationTable, locationRows, (r) => `${r.policy_id}_${r.location_id}_${r._doc_version}`)
      : Promise.resolve(),
  ]);
};
```

Create analogous files for submissions, quotes, transactions, tax transactions, and tax calculations.

### 2.3 — CDC trigger registrations

**Modify:** `functions/src/firestoreEvents/index.ts` — add one export per collection:

```typescript
export const syncpolicytobq = onDocumentWritten(
  { document: `${Collection.Enum.policies}/{policyId}` },
  async (event) => {
    await (await import('./bigquery/syncPolicyToBQ.js')).default(event);
  },
);
// ... repeat for submissions, quotes, transactions, taxTransactions, taxCalculations
```

The lazy-import pattern keeps cold starts unaffected.

> **Note on fan-out**: The `policies` collection already has `updateuseraccessonpolicychange` and `versionpolicy` triggers. Adding a BQ sync trigger is additive and independent — Firestore allows multiple triggers on the same document path.

### 2.4 — BQ deduplication view

After the raw CDC tables are populated, create BQ views that expose the deduplicated latest state:

**Example view SQL** (stored as a string constant in `functions/src/services/bigquery/views.ts` and applied via the setup route):

```sql
CREATE OR REPLACE VIEW `{project}.{dataset}.policies_latest` AS
SELECT * EXCEPT(row_num)
FROM (
  SELECT *, ROW_NUMBER() OVER (
    PARTITION BY id
    ORDER BY _doc_version DESC, _ingested_at DESC
  ) AS row_num
  FROM `{project}.{dataset}.policies`
  WHERE NOT _deleted
)
WHERE row_num = 1;
```

Create equivalent views for all CDC tables.

---

## Phase 3: Tax Reconciliation Pipeline

> A daily batch job that joins `taxTransactions` against `taxCalculations`, verifies amounts against expected values, aggregates tax liability by state, and flags discrepancies.

### 3.1 — Reconciliation logic

**New file:** `functions/src/scheduler/reconcileTaxTransactions.ts`

**Step 1 — Load all taxTransactions from the last N days**

Query `taxTransactions` where `taxDate >= (today - lookbackDays)`. The lookback window (default: 7 days) is configurable via a `taxReconciliationConfig/default` Firestore doc to avoid re-reading the entire corpus on every run.

**Step 2 — Batch-load parent taxCalculations**

Collect all unique `taxCalcId` values, deduplicate, and fetch in parallel batches of 10 using `db.getAll(...docRefs)`. This avoids N+1 reads.

**Step 3 — Reconcile each transaction**

For each `TaxOgTransaction`:
- Look up its `TaxCalc` by `taxCalcId`.
- Expected tax: `taxCalc.value` (for full payments) or `round(taxCalc.value * (transaction.chargeAmount / taxCalc.subjectBaseItemValues.premium))` for partial payments.
- Tolerance: `Math.abs(actual - expected) > max(1 cent, 0.001 * expected)`.
- Flag discrepancies over tolerance as `TaxReconciliationError`.

For each `TaxReversalTransaction`:
- Find the original transaction (via `reversal.originalTransactionId`).
- Verify: `Math.abs(reversal.taxAmount) <= Math.abs(original.taxAmount)` (refund cannot exceed original tax).
- Verify proportionality: `reversal.taxAmount / original.taxAmount ≈ reversal.chargeAmount / original.chargeAmount` within tolerance.

**Step 4 — Aggregate tax liability**

Produce a `TaxReconciliationReport`:
```typescript
{
  reportDate: string,             // "YYYY-MM-DD"
  totalTaxCollected: number,      // sum of all og transaction taxAmounts
  totalTaxRefunded: number,       // sum of all reversal taxAmounts (as positive)
  netTaxLiability: number,        // collected - refunded
  byState: Record<State, { collected, refunded, netLiability }>,
  byTransactionType: Record<TransactionType, { collected, refunded }>,
  discrepancyCount: number,
  totalDiscrepancyAmount: number,
  processedCount: number,
}
```

**Step 5 — Write outputs**
- Stream report to BQ `tax_reconciliation_reports` table (partitioned on `report_date`).
- Write `TaxReconciliationError` documents to `taxReconciliationErrors/{errorId}`.
- Update/set `taxReconciliationConfig/lastRunAt` for the lookback window on next run.

**Step 6 — Alerting**

If `discrepancyCount > 0`, publish a Pub/Sub message to a new `MISC_PUB_SUB_TOPICS.TAX_RECONCILIATION_ERROR` topic (extend existing `constants.ts`). A new Pub/Sub listener can email iDemand admins with a summary. This mirrors the existing `markPaidOnPaymentComplete` pattern.

### 3.2 — Real-time reversal validation trigger

**New file:** `functions/src/firestoreEvents/validateTaxReversal.ts`

Triggered on `onDocumentCreated` for `taxTransactions/{txId}` where `type == 'reversal'`:
- Fetches the original transaction via `reversal.originalTransactionId`.
- If the refund amount is disproportionate (> 0.5% delta from expected), writes a `TaxReconciliationError` immediately (don't wait for the batch job).

**Modify:** `functions/src/firestoreEvents/index.ts` — register trigger.

### 3.3 — Scheduler registration

**Modify:** `functions/src/scheduler/index.ts` — add:

```typescript
export const reconciletaxtransactions = onSchedule(
  { schedule: '30 3 * * *', timeZone: 'America/New_York' },
  async (event) => {
    await (await import('./reconcileTaxTransactions.js')).default(event);
  },
);
```

Runs at 3:30 AM ET, after the portfolio job at 2 AM.

### 3.4 — Type additions

**New file:** `common/src/types/taxReconciliation.ts`

```typescript
export const TaxReconciliationError = z.object({
  taxTransactionId: z.string(),
  taxCalcId: z.string().nullable(),
  policyId: z.string(),
  errorType: z.enum([
    'amount_mismatch',
    'reversal_exceeds_original',
    'reversal_disproportionate',
    'missing_tax_calc',
  ]),
  expectedAmount: z.number().nullable(),
  actualAmount: z.number(),
  deltaAmount: z.number(),
  state: State,
  taxId: z.string(),
  detectedAt: Timestamp,
  resolvedAt: Timestamp.nullable().optional(),
  status: z.enum(['open', 'resolved', 'acknowledged']),
  metadata: BaseMetadata,
});
```

---

## Phase 4: Agent Performance & Funnel Analytics

> ETL transforms on the BQ tables built in Phase 2, plus a write-back to Firestore for display in the existing admin UI.

### 4.1 — BigQuery SQL views (funnel transforms)

**New file:** `functions/src/services/bigquery/funnelViews.ts`

Define SQL strings for each view, applied via the BQ setup route. These views use the `_latest` deduplication views from Phase 2.

**`agent_funnel_daily`** — daily funnel metrics by agent:
```sql
CREATE OR REPLACE VIEW `{project}.{dataset}.agent_funnel_daily` AS
WITH subs AS (
  SELECT agent_user_id, agent_name, agency_org_id, agency_name,
    DATE(created_at) AS event_date,
    COUNT(*) AS submission_count
  FROM `{project}.{dataset}.submissions_latest`
  GROUP BY 1,2,3,4,5
),
quotes AS (
  SELECT q.agent_user_id, DATE(q.created_at) AS event_date,
    COUNT(DISTINCT q.id) AS quote_count,
    COUNT(DISTINCT q.submission_id) AS quoted_submission_count
  FROM `{project}.{dataset}.quotes_latest` q
  GROUP BY 1,2
),
policies AS (
  SELECT p.agent_user_id, DATE(p.effective_date) AS event_date,
    COUNT(DISTINCT p.id) AS bound_count,
    AVG(p.term_premium) AS avg_term_premium,
    SUM(p.term_premium) AS total_term_premium,
    COUNTIF(p.cancel_eff_date IS NOT NULL) AS cancelled_count,
    AVG(TIMESTAMP_DIFF(p.created_at, q.created_at, HOUR)) AS avg_hours_to_bind
  FROM `{project}.{dataset}.policies_latest` p
  LEFT JOIN `{project}.{dataset}.quotes_latest` q ON p.quote_id = q.id
  GROUP BY 1,2
)
SELECT s.*, q.quote_count, q.quoted_submission_count,
  p.bound_count, p.avg_term_premium, p.total_term_premium,
  p.cancelled_count, p.avg_hours_to_bind,
  SAFE_DIVIDE(q.quoted_submission_count, s.submission_count) AS submission_to_quote_rate,
  SAFE_DIVIDE(p.bound_count, q.quote_count) AS quote_to_bind_rate
FROM subs s
LEFT JOIN quotes q USING (agent_user_id, event_date)
LEFT JOIN policies p USING (agent_user_id, event_date);
```

Add similar views for org-level aggregations and time-windowed (7d, 30d, 90d) rollups.

### 4.2 — Write-back to Firestore

**New file:** `functions/src/scheduler/syncAgentFunnelToFirestore.ts`

- Runs weekly (Sunday at 4 AM ET).
- Queries BQ `agent_funnel_weekly` view (30-day window).
- For each org, writes a summary to `organizations/{orgId}` as a merge update:

```typescript
{
  analytics: {
    funnel: {
      lastUpdated: Timestamp.now(),
      period: '30d',
      submissionCount: n,
      submissionToQuoteRate: 0.72,
      quoteToBind: 0.45,
      avgHoursToBind: 18.3,
      avgTermPremium: 1240,
      cancellationRate: 0.05,
    }
  }
}
```

This writes to the existing `organizations` collection rather than a new collection, making it immediately available to the existing admin org UI without new Firestore reads on the client.

**Modify:** `functions/src/scheduler/index.ts` — register the schedule.

### 4.3 — Type additions

**Modify:** `common/src/types/organization.ts` — add `analytics` field to `Organization`:

```typescript
export const OrgFunnelAnalytics = z.object({
  lastUpdated: Timestamp,
  period: z.string(),
  submissionCount: z.number().int(),
  submissionToQuoteRate: z.number(),
  quoteToBind: z.number(),
  avgHoursToBind: z.number(),
  avgTermPremium: z.number(),
  cancellationRate: z.number(),
});
```

---

## Implementation Order & Interdependencies

```
Phase 0: BQ client, schemas, streamRows, transforms
    └── Phase 1: Portfolio pipeline (standalone, no BQ CDC dependency)
    └── Phase 2: Firestore CDC triggers → BQ tables
            └── Phase 3: Tax reconciliation (uses taxTransactions/taxCalcs CDC tables as BQ sink)
            └── Phase 4: Funnel analytics (SQL views on Phase 2 tables + write-back)
```

Phase 1 can be built and deployed entirely independently of Phases 2–4. It only needs the BQ client/streamRows from Phase 0.

Phase 3's batch reconciliation reads from Firestore directly (not BQ), so it can be deployed as soon as Phase 0 is done. The BQ write in Phase 3 is the sink, not the source.

---

## File Change Summary

### New files

```
common/src/types/portfolioExposure.ts
common/src/types/taxReconciliation.ts

functions/src/services/bigquery/client.ts
functions/src/services/bigquery/schemas.ts
functions/src/services/bigquery/ensureTables.ts
functions/src/services/bigquery/streamRows.ts
functions/src/services/bigquery/transforms.ts
functions/src/services/bigquery/views.ts
functions/src/services/bigquery/funnelViews.ts
functions/src/services/bigquery/rowTransforms/policy.ts
functions/src/services/bigquery/rowTransforms/transaction.ts
functions/src/services/bigquery/rowTransforms/submission.ts
functions/src/services/bigquery/rowTransforms/quote.ts
functions/src/services/bigquery/rowTransforms/taxTransaction.ts
functions/src/services/bigquery/rowTransforms/taxCalculation.ts

functions/src/scheduler/computePortfolioExposure.ts
functions/src/scheduler/reconcileTaxTransactions.ts
functions/src/scheduler/syncAgentFunnelToFirestore.ts

functions/src/callables/triggerPortfolioExposure.ts

functions/src/firestoreEvents/bigquery/syncPolicyToBQ.ts
functions/src/firestoreEvents/bigquery/syncSubmissionToBQ.ts
functions/src/firestoreEvents/bigquery/syncQuoteToBQ.ts
functions/src/firestoreEvents/bigquery/syncTransactionToBQ.ts
functions/src/firestoreEvents/bigquery/syncTaxTransactionToBQ.ts
functions/src/firestoreEvents/bigquery/syncTaxCalcToBQ.ts
functions/src/firestoreEvents/validateTaxReversal.ts

functions/src/routes/bigquerySetup.ts
```

### Modified files

```
common/src/enums.ts                         (add Collection enum values)
common/src/types/index.ts                   (export new types)
common/src/types/organization.ts            (add analytics field)

functions/src/scheduler/index.ts            (register 3 new schedules)
functions/src/callables/index.ts            (register triggerPortfolioExposure)
functions/src/firestoreEvents/index.ts      (register CDC triggers + validateTaxReversal)
functions/src/common/dbCollections.ts       (add portfolio/reconciliation collection helpers)
functions/src/routes/index.ts               (wire bigquerySetup route)
functions/src/common/constants.ts           (add new Pub/Sub topic)

firestore.indexes.json                      (add locations collection group index)
firestore.rules                             (add rules for new collections)
```

---

## Professional Engineering Notes

### Idempotency

The portfolio batch job is fully idempotent: it overwrites `portfolioExposure/current/buckets/{bucketId}` on each run rather than appending. BQ writes use `insertId` for streaming dedup. The tax reconciliation job uses a lookback window with a `lastRunAt` cursor to avoid reprocessing the entire history on every run.

### Observability

Each scheduled job logs a structured completion summary (counts, TIV totals, duration, error counts) via `firebase-functions/logger`. These surface in Cloud Logging and can drive dashboards or alerting policies in GCP. Sentry is already wired into callables via `onCallWrapper`; the scheduler functions use the existing `getReportErrorFn` pattern for consistent error reporting.

### Cold starts

All new functions follow the existing lazy-import pattern — no heavy imports at module level. The BQ client is lazily initialized (same as the Typesense client). The portfolio scheduler is the most compute-intensive and may benefit from raising its memory/timeout to `{ memory: '512MiB', timeoutSeconds: 300 }` via `onSchedule` options.

### Scalability

The portfolio batch job reads all policy location documents on each run. At tens of thousands of locations this is fine for a scheduled batch job with Firestore's collection group queries. If the book grows to hundreds of thousands of locations, the next step is to switch to the Firestore export → BigQuery path for the initial load, and use location-created/updated triggers to maintain incremental exposure bucket updates. The trigger-based incremental path (registering on `locations/{locationId}`) would replace the full batch scan.

### BigQuery cost controls

All tables are date-partitioned. Downstream queries should always include a `WHERE _partitiondate BETWEEN ...` filter to avoid full-table scans. The deduplication views add a second scan layer, so downstream analytics should always query the `_latest` views rather than the raw tables.

### Testing strategy

- **Pure transform functions** (`policyToRow`, `buildBucketId`, reconciliation math) are pure functions and unit-testable without Firebase emulators.
- **Scheduler functions** should be tested via the existing HTTP-trigger helper pattern (`pubSubHelper.ts`) or the new `triggerPortfolioExposure` callable.
- **CDC triggers** are integration-tested by writing a document to the Firestore emulator and asserting the BQ `streamRows` mock was called with the right row shape.
