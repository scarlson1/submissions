import {
  concentrationAlertsCollection,
  ExposureConfig,
  exposureConfigDoc,
  locationsCollection,
  policiesCollection,
  portfolioExposureBucketsCollection,
  portfolioExposureSnapshotCollection,
  type ConcentrationAlert,
  type ExposureBucket,
  type ExposureSnapshot,
  type ILocationPolicy,
  type Policy,
} from '@idemand/common';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { info } from 'firebase-functions/logger';
import type { ScheduledEvent } from 'firebase-functions/scheduler';

import { getBigQueryClient } from '../services/bigquery/client.js';
import { streamRows } from '../services/bigquery/streamRows.js';
import { splitChunks } from '../utils/arrays.js';
import { bigqueryDataset } from '../utils/environmentVars.js';

/**
 * Accumulator type used during bucket aggregation. Defers policyId deduplication
 * to a Set (O(1) per insert) rather than re-spreading an array each iteration.
 * Converted to ExposureBucket[] when writing to Firestore / BQ.
 */
type MutableBucket = Omit<ExposureBucket, 'policyIds' | 'computedAt'> & {
  policyIds: Set<string>;
};

export default async (event: ScheduledEvent) => {
  const startMS = Date.now();
  const db = getFirestore();
  const exposureConfigSnap = await exposureConfigDoc(db).get();
  // ExposureConfig.parse({}) applies every .default() on the schema, so a
  // missing config doc gets sensible values rather than a hard throw.
  const config: ExposureConfig = ExposureConfig.parse(
    exposureConfigSnap.data() ?? {},
  );

  // Step 1 — authoritative set of active, paid policies.
  // The locations collection is NOT used as the source of truth here because
  // phantom location docs can exist (e.g. CSV imports create location docs
  // before the import is approved/rejected).
  const policySnap = await policiesCollection(db)
    .where('paymentStatus', '==', 'paid')
    .where('cancelEffDate', '==', null)
    .get();

  // Step 2 — collect IDs of non-cancelled locations from each policy.
  const locationIds = new Set<string>();
  for (const doc of policySnap.docs) {
    const policy = doc.data() as Policy;
    for (const [lcnId, lcn] of Object.entries(policy.locations ?? {})) {
      if (lcn.cancelEffDate == null) {
        locationIds.add(lcnId);
      }
    }
  }

  // Step 3 — batch-fetch full location docs (getAll chunks at 500 per Firestore limit).
  const locationRefs = [...locationIds].map((id) =>
    locationsCollection(db).doc(id),
  );
  const chunks = splitChunks(locationRefs, 500);
  const locationDocs: ILocationPolicy[] = [];
  for (const chunk of chunks) {
    const snaps = await db.getAll(...chunk);
    for (const snap of snaps) {
      if (snap.exists) locationDocs.push(snap.data() as ILocationPolicy);
    }
  }

  // Step 4 — bucket by (state, countyFIPS, floodZone, geohashPrefix).
  const buckets = new Map<string, MutableBucket>();

  for (const loc of locationDocs) {
    const bucketId = buildBucketId(loc, config.geohashPrecision);
    if (bucketId === null) continue;

    const bucket =
      buckets.get(bucketId) ??
      newEmptyBucket(bucketId, loc, config.geohashPrecision);
    bucket.locationCount++;
    bucket.totalInsuredValue += loc.TIV;
    bucket.totalTermPremium += loc.termPremium;
    bucket.avgDeductible = rollingAvg(
      bucket.avgDeductible,
      loc.deductible,
      bucket.locationCount,
    );
    bucket.policyIds.add(loc.policyId);
    buckets.set(bucketId, bucket);
  }

  const now = Timestamp.now();
  const snapshotDate = now.toDate().toISOString().slice(0, 10); // YYYY-MM-DD

  // Convert MutableBuckets → ExposureBuckets (Set → array, stamp computedAt).
  const finalBuckets: ExposureBucket[] = [...buckets.values()].map((b) => ({
    ...b,
    policyIds: [...b.policyIds],
    computedAt: now,
  }));

  // Step 7a — read previous buckets BEFORE overwriting in step 5.
  // portfolioExposure/current/buckets always holds the previous run's data
  // (yesterday for a daily job). We need it now because step 5 will overwrite it.
  const prevBucketSnaps = await portfolioExposureBucketsCollection(db).get();
  const prevBuckets = new Map<string, ExposureBucket>(
    prevBucketSnaps.docs.map((d) => [d.id, d.data()]),
  );

  // Step 5 — Firestore write
  // Batch write buckets to portfolioExposure/current/buckets/{bucketId}.
  // Each batch is capped at 500 operations (Firestore hard limit).
  const bucketCol = portfolioExposureBucketsCollection(db);
  const bucketChunks = splitChunks(finalBuckets, 500);
  for (const chunk of bucketChunks) {
    const batch = db.batch();
    for (const bucket of chunk) {
      // set (not update) so stale buckets that no longer have active locations
      // are fully replaced rather than merged with old field values.
      batch.set(bucketCol.doc(bucket.bucketId), bucket);
    }
    await batch.commit();
  }

  // Delete bucket docs that existed in the previous run but have no active
  // coverage today (e.g. a large policy was cancelled). Without this, ghost
  // buckets persist in current/buckets indefinitely, inflating prevBuckets
  // on the next run and potentially suppressing shift alerts.
  const finalBucketIds = new Set(finalBuckets.map((b) => b.bucketId));
  const staleIds = [...prevBuckets.keys()].filter(
    (id) => !finalBucketIds.has(id),
  );
  if (staleIds.length > 0) {
    const staleChunks = splitChunks(staleIds, 500);
    for (const chunk of staleChunks) {
      const batch = db.batch();
      for (const id of chunk) {
        batch.delete(bucketCol.doc(id));
      }
      await batch.commit();
    }
    info(`Deleted ${staleIds.length} stale bucket(s) from current/buckets`);
  }

  // Write snapshot summary to portfolioExposure/history/snapshots/{YYYY-MM-DD}.
  const snapshot: ExposureSnapshot = {
    snapshotDate,
    totalLocationCount: finalBuckets.reduce(
      (sum, b) => sum + b.locationCount,
      0,
    ),
    totalInsuredValue: finalBuckets.reduce(
      (sum, b) => sum + b.totalInsuredValue,
      0,
    ),
    totalTermPremium: finalBuckets.reduce(
      (sum, b) => sum + b.totalTermPremium,
      0,
    ),
    bucketCount: finalBuckets.length,
    computedAt: now,
    computedBy: `computePortfolioExposure/${event.jobName}`,
  };
  await portfolioExposureSnapshotCollection(db)
    .doc(snapshotDate)
    .set(snapshot, { merge: false });

  // Step 6 — BigQuery write
  // computedAt drives partition routing; bucketId + snapshotDate is the insertId
  // so re-running on the same day deduplicates within BQ's ~1-minute window.
  const computedAtIso = now.toDate().toISOString();
  const bqRows: PortfolioExposureBQRow[] = finalBuckets.map((b) => ({
    snapshot_date: snapshotDate,
    bucket_id: b.bucketId,
    state: b.state,
    county_fips: b.countyFips,
    county_name: b.countyName,
    flood_zone: b.floodZone,
    geohash_prefix: b.geohashPrefix,
    location_count: b.locationCount,
    total_insured_value: b.totalInsuredValue,
    total_term_premium: b.totalTermPremium,
    avg_deductible: b.avgDeductible,
    computed_at: computedAtIso,
    computed_by: snapshot.computedBy,
  }));

  const bq = getBigQueryClient();
  const table = bq.dataset(bigqueryDataset.value()).table('portfolio_exposure');
  await streamRows(table, bqRows, (row) => `${row.bucket_id}_${snapshotDate}`);

  // Step 7b — bucket-level concentration alert detection.
  //
  // Two alert types, evaluated per bucket:
  //
  // absolute_tiv:
  //   Fires when a bucket's total insured value exceeds a hard threshold,
  //   regardless of prior state. No previous data needed.
  //   shiftPct = null, previousTiv = null, thresholdTiv = absoluteTivThreshold.
  //
  // day_over_day_shift  (stored as 'week_over_week_shift' per schema):
  //   Fires when |currentTiv - previousTiv| / previousTiv > shiftPctThreshold.
  //   New buckets (no previous entry) are skipped — a brand-new bucket would
  //   always show a 100%+ shift and is expected, not anomalous.
  //   thresholdTiv = null, previousTiv = prev bucket's TIV.

  const alerts: ConcentrationAlert[] = [];

  for (const bucket of finalBuckets) {
    // --- absolute_tiv ---
    if (bucket.totalInsuredValue > config.absoluteTivThreshold) {
      alerts.push({
        bucketId: bucket.bucketId,
        state: bucket.state,
        countyFips: bucket.countyFips,
        floodZone: bucket.floodZone,
        geohashPrefix: bucket.geohashPrefix,
        alertType: 'absolute_tiv',
        currentTiv: bucket.totalInsuredValue,
        thresholdTiv: config.absoluteTivThreshold,
        previousTiv: null,
        shiftPct: null,
        detectedAt: now,
        status: 'active',
      });
    }

    // --- day_over_day_shift ---
    const prev = prevBuckets.get(bucket.bucketId);
    if (prev === undefined) continue; // new bucket — skip, not a shift signal

    const prevTiv = prev.totalInsuredValue;
    if (prevTiv === 0) continue; // avoid divide-by-zero on a previously empty bucket

    const shiftPct = Math.abs(bucket.totalInsuredValue - prevTiv) / prevTiv;

    if (shiftPct > config.weekOverWeekShiftPctThreshold) {
      alerts.push({
        bucketId: bucket.bucketId,
        state: bucket.state,
        countyFips: bucket.countyFips,
        floodZone: bucket.floodZone,
        geohashPrefix: bucket.geohashPrefix,
        alertType: 'week_over_week_shift',
        currentTiv: bucket.totalInsuredValue,
        thresholdTiv: null,
        previousTiv: prevTiv,
        shiftPct,
        detectedAt: now,
        status: 'active',
      });
    }
  }

  // Batch write alerts (each alert gets a Firestore auto-ID).
  if (alerts.length > 0) {
    const alertCol = concentrationAlertsCollection(db);
    const alertChunks = splitChunks(alerts, 500);
    for (const chunk of alertChunks) {
      const batch = db.batch();
      for (const alert of chunk) {
        batch.set(alertCol.doc(), alert);
      }
      await batch.commit();
    }
  }
  // TODO: firestore collection listener to send notification

  const result: ExposureRunResult = {
    snapshotDate,
    bucketCount: finalBuckets.length,
    totalTiv: snapshot.totalInsuredValue,
    alertsRaised: alerts.length,
    durationMs: Math.round(Date.now() - startMS),
  };

  info('computePortfolioExposure complete', result);
  return result;
};

// ---------------------------------------------------------------------------
// Types & helpers
// ---------------------------------------------------------------------------

export interface ExposureRunResult {
  snapshotDate: string;
  bucketCount: number;
  totalTiv: number;
  alertsRaised: number;
  durationMs: number;
}

/** Flat BQ row matching the portfolio_exposure table schema. */
interface PortfolioExposureBQRow {
  snapshot_date: string; // DATE  YYYY-MM-DD
  bucket_id: string; // STRING  state#countyFips#floodZone#geohashPrefix
  state: string;
  county_fips: string | null;
  county_name: string | null;
  flood_zone: string;
  geohash_prefix: string;
  location_count: number;
  total_insured_value: number;
  total_term_premium: number;
  avg_deductible: number;
  computed_at: string; // TIMESTAMP  ISO-8601
  computed_by: string;
}

const BUCKET_DELIMITER = '#';

/**
 * Builds a deterministic bucket key from the four concentration dimensions.
 * Returns null — and logs a warning — when geoHash is missing so the caller
 * can skip the location with a `continue` rather than inserting a malformed key.
 */
function buildBucketId(
  loc: ILocationPolicy,
  geohashPrecision: number,
): string | null {
  const prefix = loc.geoHash?.slice(0, geohashPrecision);
  if (!prefix) {
    info('Skipping location with missing geoHash', {
      locationId: loc.locationId,
    });
    return null;
  }
  return [
    loc.address.state,
    loc.address.countyFIPS ?? 'unknown',
    loc.ratingPropertyData.floodZone,
    prefix,
  ].join(BUCKET_DELIMITER);
}

function newEmptyBucket(
  bucketId: string,
  loc: ILocationPolicy,
  geohashPrecision: number,
): MutableBucket {
  return {
    bucketId,
    state: loc.address.state as ExposureBucket['state'],
    countyFips: loc.address.countyFIPS ?? null,
    countyName: loc.address.countyName ?? null,
    floodZone: loc.ratingPropertyData.floodZone,
    geohashPrefix: loc.geoHash.slice(0, geohashPrecision),
    locationCount: 0,
    totalInsuredValue: 0,
    totalTermPremium: 0,
    avgDeductible: 0,
    policyIds: new Set<string>(),
  };
}

/**
 * Incrementally updates a running average without storing the full history.
 * @param currentAvg  Average of the previous (newCount - 1) items.
 * @param newValue    The value being added.
 * @param newCount    Total item count after adding newValue.
 */
function rollingAvg(
  currentAvg: number,
  newValue: number,
  newCount: number,
): number {
  return (currentAvg * (newCount - 1) + newValue) / newCount;
}
