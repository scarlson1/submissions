import { orgsCollection } from '@idemand/common';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { projectID } from 'firebase-functions/params';
import type { ScheduledEvent } from 'firebase-functions/scheduler';
import { getBigQueryClient } from '../services/bigquery/client.js';
import { splitChunks } from '../utils/arrays.js';
import { bigqueryDataset } from '../utils/environmentVars.js';

const LOOKBACK_DAYS = 90;

interface OrgFunnelRow {
  org_id: string;
  submission_count: number;
  sub_to_quote_rate: number | null;
  quote_to_bind_rate: number | null;
  avg_hours_to_bind: number | null;
  avg_term_premium: number | null;
  cancellation_rate: number;
}

function buildQuery(projectId: string, datasetId: string): string {
  const ref = (view: string) => `\`${projectId}.${datasetId}.${view}\``;
  return `
WITH funnel AS (
  SELECT
    org_id,
    COUNT(*)                                                               AS submission_count,
    SAFE_DIVIDE(COUNTIF(reached_quote),  COUNT(*))                         AS sub_to_quote_rate,
    SAFE_DIVIDE(COUNTIF(reached_policy), COUNTIF(reached_quote))           AS quote_to_bind_rate,
    AVG(IF(reached_policy,
      TIMESTAMP_DIFF(policy_created_at, submitted_at, MINUTE) / 60.0,
      NULL))                                                               AS avg_hours_to_bind,
    AVG(IF(reached_policy, term_premium, NULL))                            AS avg_term_premium
  FROM ${ref('v_funnel_submission_to_policy')}
  WHERE submitted_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${LOOKBACK_DAYS} DAY)
    AND org_id IS NOT NULL
  GROUP BY org_id
),
cancellations AS (
  SELECT
    agency.org_id                                                          AS org_id,
    SAFE_DIVIDE(
      COUNTIF(cancel_eff_date IS NOT NULL),
      COUNT(*)
    )                                                                      AS cancellation_rate
  FROM ${ref('v_policies')}
  WHERE agency.org_id IS NOT NULL
    AND effective_date >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${LOOKBACK_DAYS} DAY)
  GROUP BY org_id
)
SELECT
  f.org_id,
  f.submission_count,
  f.sub_to_quote_rate,
  f.quote_to_bind_rate,
  f.avg_hours_to_bind,
  f.avg_term_premium,
  COALESCE(c.cancellation_rate, 0.0) AS cancellation_rate
FROM funnel f
LEFT JOIN cancellations c USING (org_id)`;
}

export default async (_event: ScheduledEvent) => {
  const db = getFirestore();
  const bq = getBigQueryClient();
  const datasetId = bigqueryDataset.value();
  const projectId = projectID.value();

  const [rows] = await bq.query({ query: buildQuery(projectId, datasetId) });
  const typedRows = rows as OrgFunnelRow[];
  if (!typedRows.length) return;

  const now = Timestamp.now();
  const periodStart = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const periodEnd = new Date().toISOString().slice(0, 10);
  const period = `${periodStart}/${periodEnd}`;

  const orgs = orgsCollection(db);

  for (const chunk of splitChunks(typedRows, 500)) {
    const batch = db.batch();
    for (const row of chunk) {
      batch.update(orgs.doc(row.org_id), {
        'analytics.funnel': {
          lastUpdated: now,
          period,
          submissionCount: row.submission_count,
          submissionToQuoteRate: row.sub_to_quote_rate ?? 0,
          quoteToBind: row.quote_to_bind_rate ?? 0,
          avgHoursToBind: row.avg_hours_to_bind ?? 0,
          avgTermPremium: row.avg_term_premium ?? 0,
          cancellationRate: row.cancellation_rate,
        },
      });
    }
    await batch.commit();
  }
};
