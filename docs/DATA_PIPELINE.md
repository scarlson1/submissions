# Data Pipeline

The data pipeline lives in the `pipeline/` workspace package — a separate Firebase Functions deployment from `functions/`. It is responsible for:

1. **CDC sync** — streaming Firestore document changes to BigQuery in near-real-time
2. **Portfolio exposure** — daily aggregation of active policy locations into geospatial risk buckets
3. **Tax reconciliation** — nightly validation of tax transactions against their tax calculations
4. **Funnel analytics** — weekly BigQuery-to-Firestore write-back of org-level conversion metrics

---

## Architecture

```
Firestore
  │
  ├── onDocumentWritten triggers (CDC)
  │     └──► BigQuery raw tables  ──► dedup views ──► funnel views
  │
  └── scheduled cron jobs
        ├── computePortfolioExposure  ──► Firestore (buckets, alerts) + BQ
        ├── reconcileTaxTransactions  ──► Firestore (errors) + BQ (report)
        └── syncAgentFunnelToFirestore ──► Firestore (org analytics)
```

**Design principle:** the application UI never reads BigQuery directly. The pipeline maintains Firestore as the read-model for UI consumption by writing aggregated results back to existing collections. BigQuery is the layer for analyst/BI queries.

---

## BigQuery Tables

All tables are date-partitioned and clustered. In `dev`, partitions expire after 90 days; `prod` has no expiry. In `prod`, partition filter on queries is enforced (`requirePartitionFilter: true`).

| Table                            | Partition field  | Cluster fields                            | Source                       |
| -------------------------------- | ---------------- | ----------------------------------------- | ---------------------------- |
| `policies`                       | `effective_date` | `home_state`, `product`, `payment_status` | CDC trigger                  |
| `policy_locations`               | `effective_date` | `state`, `flood_zone`, `county_fips`      | CDC trigger (via `policies`) |
| `quotes`                         | `_ingested_at`   | `home_state`, `submission_id`             | CDC trigger                  |
| `submissions`                    | `_ingested_at`   | `home_state`, `status`                    | CDC trigger                  |
| `transactions`                   | `_ingested_at`   | `transaction_type`, `policy_id`           | CDC trigger                  |
| `tax_transactions`               | `tax_date`       | `state`, `tax_id`, `type`                 | CDC trigger                  |
| `tax_calculations`               | `calc_date`      | `state`, `tax_id`                         | CDC trigger                  |
| `portfolio_exposure`             | `computed_at`    | `state`, `flood_zone`, `county_fips`      | Portfolio cron               |
| `portfolio_concentration_alerts` | `detected_at`    | `state`, `flood_zone`                     | Portfolio cron               |
| `tax_reconciliation_reports`     | `report_date`    | —                                         | Reconciliation cron          |

### System columns

Every CDC table carries four system columns:

| Column         | Type        | Description                                 |
| -------------- | ----------- | ------------------------------------------- |
| `_id`          | `STRING`    | Firestore document ID                       |
| `_deleted`     | `BOOLEAN`   | `true` when the source document was deleted |
| `_doc_version` | `INTEGER`   | `metadata.version` from the document        |
| `_ingested_at` | `TIMESTAMP` | Wall-clock time the row was written to BQ   |

---

## Dedup Views

Raw CDC tables accumulate one row per document write. The dedup views expose the current (latest, non-deleted) state of each document. **Always query views, not raw tables.**

| View                 | Source table       |
| -------------------- | ------------------ |
| `v_policies`         | `policies`         |
| `v_policy_locations` | `policy_locations` |
| `v_quotes`           | `quotes`           |
| `v_submissions`      | `submissions`      |
| `v_transactions`     | `transactions`     |
| `v_tax_transactions` | `tax_transactions` |
| `v_tax_calculations` | `tax_calculations` |

Dedup logic (applied to every view):

```sql
SELECT * EXCEPT (_row_num)
FROM (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY _id
      ORDER BY _doc_version DESC NULLS LAST, _ingested_at DESC
    ) AS _row_num
  FROM `project.dataset.<table>`
)
WHERE _row_num = 1
  AND NOT _deleted
```

---

## Funnel Views

Built on top of the dedup views. Defined in `pipeline/src/services/bigquery/funnelViews.ts`.

### `v_funnel_submission_to_policy`

One row per submission. Joins `v_submissions → v_quotes → v_policies` using the submission's "best" quote (bound quote wins; otherwise the most recently published one).

Key columns:

| Column                                        | Description                                     |
| --------------------------------------------- | ----------------------------------------------- |
| `submission_id`                               | Firestore submission ID                         |
| `org_id`                                      | Agency org ID (`agency.org_id` from submission) |
| `submitted_at`                                | Submission BQ ingest time                       |
| `product`, `state`, `comm_source`             | Submission attributes                           |
| `quote_id`, `quote_status`, `quoted_premium`  | Best quote                                      |
| `policy_id`, `term_premium`, `payment_status` | Bound policy (NULL if not bound)                |
| `policy_created_at`                           | Policy BQ ingest time                           |
| `reached_quote`                               | `BOOL` — true if any quote was created          |
| `reached_policy`                              | `BOOL` — true if the quote was bound            |

### `v_funnel_daily`

Aggregates `v_funnel_submission_to_policy` by `date / product / state / comm_source`.

| Column                    | Description                                   |
| ------------------------- | --------------------------------------------- |
| `submissions`             | Total submissions in that group               |
| `quoted`                  | Submissions that produced at least one quote  |
| `bound`                   | Submissions that resulted in a bound policy   |
| `sub_to_quote_rate`       | `quoted / submissions`                        |
| `quote_to_bound_rate`     | `bound / quoted`                              |
| `overall_conversion_rate` | `bound / submissions`                         |
| `avg_bound_premium`       | Average `term_premium` of bound policies only |

---

## CDC Triggers

Defined in `pipeline/src/firestoreEvents/`. Each trigger fires on `onDocumentWritten` (covers creates, updates, and deletes).

| Export                   | Collection                | BQ tables written              |
| ------------------------ | ------------------------- | ------------------------------ |
| `syncpolicytobq`         | `policies/{policyId}`     | `policies`, `policy_locations` |
| `syncquotetobq`          | `quotes/{quoteId}`        | `quotes`                       |
| `synctransactiontobq`    | `transactions/{trxId}`    | `transactions`                 |
| `synctaxtransactiontobq` | `taxTransactions/{trxId}` | `tax_transactions`             |
| `synctaxcalctobq`        | `taxCalculations/{docId}` | `tax_calculations`             |

**Policy locations note:** `syncpolicytobq` reads location documents from the `locations/{id}` collection (via `db.getAll`) rather than using the embedded `PolicyLocation` map on the policy doc. This gives authoritative location data with full field coverage (limits, RCVs, etc.).

**Delete handling:** `isDelete = !event.data?.after?.exists`. On delete, the pre-delete snapshot is used for the row body, and `_deleted` is set to `true`. The dedup view's `NOT _deleted` filter suppresses these rows from view consumers.

**Deduplication window:** BQ streaming inserts use an `insertId` derived from `${_id}_${_doc_version}` to deduplicate within BQ's ~1-minute window. For longer-term deduplication, the dedup views use `_doc_version`.

---

## Scheduled Jobs

### `computePortfolioExposure` — daily at 02:00 ET

Aggregates all active, paid, non-cancelled policy locations into geospatial exposure buckets.

**Steps:**

1. Reads `ExposureConfig` from `config/exposure` (thresholds, geohash precision). Defaults apply if doc is missing.
2. Queries `policies` for `paymentStatus == 'paid' && cancelEffDate == null`. Collects non-cancelled location IDs.
3. Batch-fetches location documents via `db.getAll`.
4. Aggregates into `Map<bucketId, ExposureBucket>` where `bucketId = state#countyFips#floodZone#geohash5`.
5. Writes buckets to `portfolioExposure/current/buckets/{bucketId}` (full overwrite — stale buckets are cleared).
6. Streams all bucket rows to BQ `portfolio_exposure`.
7. Compares against yesterday's snapshot to detect concentration shifts. Writes `ConcentrationAlert` docs to `portfolioConcentrationAlerts/{alertId}`.
8. Writes a snapshot doc to `portfolioExposure/history/snapshots/{YYYY-MM-DD}`.

**Firestore outputs:**

- `portfolioExposure/current/buckets/{bucketId}` — live exposure map
- `portfolioExposure/history/snapshots/{date}` — daily snapshot for change detection
- `portfolioConcentrationAlerts/{alertId}` — active concentration alerts

### `reconcileTaxTransactions` — daily at 03:30 ET

Validates tax transactions against their tax calculations and flags discrepancies.

**Steps:**

1. Reads `TaxReconciliationConfig` from `config/taxReconciliation` (`lookbackDays`, default 7).
2. Fetches `taxTransactions` where `taxDate >= now - lookbackDays`.
3. Batch-fetches all referenced `taxCalculations` and original transactions (for reversals) via `db.getAll`.
4. For each `transaction` type: compares `taxAmount` vs `taxCalc.value` within tolerance (`max(0.01, 0.001 * expected)`). Flags `missing_tax_calc` or `amount_mismatch`.
5. For each `reversal` type: verifies refund does not exceed original and is proportional to the charge refunded (within 0.01). Flags `reversal_exceeds_original` or `reversal_disproportionate`.
6. Writes `TaxReconciliationError` docs to `taxReconciliationErrors/{id}` (batched).
7. Streams a reconciliation report row to BQ `tax_reconciliation_reports`.
8. Updates `config/taxReconciliation.lastRunAt`.
9. If any errors were found, publishes to `TAX_RECONCILIATION_ERROR` Pub/Sub topic.

**Firestore outputs:**

- `taxReconciliationErrors/{id}` — individual error records (`status: 'open' | 'resolved' | 'acknowledged'`)
- `config/taxReconciliation.lastRunAt` — audit cursor

**Error types:**

| `errorType`                 | Meaning                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------- |
| `missing_tax_calc`          | No `TaxCalc` document found for the transaction's `taxCalcId`                       |
| `amount_mismatch`           | Collected tax differs from the tax calculation's expected value beyond tolerance    |
| `reversal_exceeds_original` | Refund amount exceeds the original transaction's tax amount                         |
| `reversal_disproportionate` | Refund tax / original tax ratio doesn't match refund charge / original charge ratio |

### `syncAgentFunnelToFirestore`

Implemented in `pipeline/src/cron/syncAgentFunnelToFirestore.ts`.

Queries `v_funnel_submission_to_policy` and `v_policies` per org over a 90-day lookback window, then writes the result to `organizations/{orgId}.analytics.funnel` via `batch.update` with dotted-path notation (preserves other `analytics` subfields).

---

## Real-time Reversal Validation

`validateTaxReversal` is a separate `onDocumentCreated` trigger in the `functions/` package (not `pipeline/`). It validates reversal transactions immediately on creation — before the nightly batch job runs — and writes a `TaxReconciliationError` doc if the reversal fails validation.

---

## Admin Endpoints & Callables

### `POST /bigquerysetup`

Provisions or updates all BQ tables and views. Safe to call on every deploy. Run this after schema changes or when setting up a new environment.

Idempotent: existing tables are left in place (schema updates require manual migration); existing views are updated in place.

### `triggerPortfolioExposure` (callable)

Manually runs the portfolio exposure pipeline. Requires `iDemandAdmin` claim. Accepts no arguments. Returns `{ bucketCount, totalTiv, alertsRaised }`.

Useful for immediate re-computation after data corrections without waiting for the 02:00 cron.

---

## Pub/Sub

| Topic constant             | When published                                        | Payload                |
| -------------------------- | ----------------------------------------------------- | ---------------------- |
| `TAX_RECONCILIATION_ERROR` | End of reconciliation run when `discrepancyCount > 0` | `{ reportId: string }` |

---

## Query Patterns

**Always use dedup views, never raw tables:**

```sql
-- Good
SELECT * FROM `project.dataset.v_policies`
WHERE home_state = 'FL';

-- Bad — includes stale versions and deleted docs
SELECT * FROM `project.dataset.policies`
WHERE home_state = 'FL';
```

**Include a partition filter in prod** (enforced; queries without one will be rejected):

```sql
SELECT *
FROM `project.dataset.v_policies`
WHERE effective_date BETWEEN '2024-01-01' AND '2024-12-31';
```

**Funnel conversion for a specific org:**

```sql
SELECT
  DATE_TRUNC(date, MONTH)       AS month,
  SUM(submissions)              AS submissions,
  SUM(bound)                    AS bound,
  AVG(overall_conversion_rate)  AS conversion_rate
FROM `project.dataset.v_funnel_daily`
WHERE org_id = 'acme-insurance'
GROUP BY month
ORDER BY month;
```

---

## Adding a New CDC Trigger

1. Add a row transform in `pipeline/src/services/bigquery/rowTransforms/<collection>.ts` — pure function, no Firebase dependencies.
2. Add the table schema to `pipeline/src/services/bigquery/schemas.ts` and `types.ts`.
3. Add a dedup view entry to `VIEW_CONFIGS` in `pipeline/src/services/bigquery/views.ts`.
4. Implement the trigger handler in `pipeline/src/firestoreEvents/sync<Collection>ToBQ.ts`.
5. Register the `onDocumentWritten` export in `pipeline/src/firestoreEvents/index.ts`.
6. Re-export from `pipeline/src/index.ts`.
7. Run `POST /bigquerysetup` to provision the new table and view.
