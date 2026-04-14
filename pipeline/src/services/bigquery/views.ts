import { info } from 'firebase-functions/logger';
import { projectID } from 'firebase-functions/params';
import { getBigQueryClient } from './client.js';

export interface ViewConfig {
  viewId: string;
  /** Receives the resolved projectId and datasetId at runtime. */
  query: (projectId: string, datasetId: string) => string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Query builders
// ---------------------------------------------------------------------------

/**
 * Standard CDC dedup view: returns the latest non-deleted state of each
 * document, ranked by _doc_version DESC then _ingested_at DESC so that a
 * re-ingested row with the same version loses to the earlier one.
 */
function dedupQuery(projectId: string, datasetId: string, tableId: string) {
  return `\
SELECT * EXCEPT (_row_num)
FROM (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY _id
      ORDER BY _doc_version DESC NULLS LAST, _ingested_at DESC
    ) AS _row_num
  FROM \`${projectId}.${datasetId}.${tableId}\`
)
WHERE _row_num = 1
  AND NOT _deleted`;
}

// ---------------------------------------------------------------------------
// View registry
// ---------------------------------------------------------------------------

export const VIEW_CONFIGS: ViewConfig[] = [
  {
    viewId: 'v_policies',
    query: (p, d) => dedupQuery(p, d, 'policies'),
    description:
      'Current (deduplicated, non-deleted) state of each policy document.',
  },
  {
    viewId: 'v_policy_locations',
    query: (p, d) => dedupQuery(p, d, 'policy_locations'),
    description:
      'Current (deduplicated, non-deleted) state of each policy location.',
  },
  {
    viewId: 'v_transactions',
    query: (p, d) => dedupQuery(p, d, 'transactions'),
    description: 'Current (deduplicated, non-deleted) state of each transaction.',
  },
  {
    viewId: 'v_submissions',
    query: (p, d) => dedupQuery(p, d, 'submissions'),
    description: 'Current (deduplicated, non-deleted) state of each submission.',
  },
  {
    viewId: 'v_quotes',
    query: (p, d) => dedupQuery(p, d, 'quotes'),
    description: 'Current (deduplicated, non-deleted) state of each quote.',
  },
  {
    viewId: 'v_tax_transactions',
    query: (p, d) => dedupQuery(p, d, 'tax_transactions'),
    description:
      'Current (deduplicated, non-deleted) state of each tax transaction.',
  },
  {
    viewId: 'v_tax_calculations',
    query: (p, d) => dedupQuery(p, d, 'tax_calculations'),
    description:
      'Current (deduplicated, non-deleted) state of each tax calculation.',
  },
];

// ---------------------------------------------------------------------------
// Provisioning
// ---------------------------------------------------------------------------

/**
 * Creates or updates all views in VIEW_CONFIGS against the given dataset.
 * Safe to call on every deploy — existing views are updated in place.
 */
export async function ensureViews(datasetId: string, views: ViewConfig[]) {
  const bq = getBigQueryClient();
  const dataset = bq.dataset(datasetId);
  const projectId = projectID.value();

  for (const { viewId, query, description } of views) {
    const sql = query(projectId, datasetId);
    const tableRef = dataset.table(viewId);
    const [exists] = await tableRef.exists();

    if (!exists) {
      await dataset.createTable(viewId, {
        view: { query: sql, useLegacySql: false },
        description,
      });
      info(`View ${viewId} created.`);
    } else {
      await tableRef.setMetadata({
        view: { query: sql, useLegacySql: false },
        description,
      });
      info(`View ${viewId} updated.`);
    }
  }
}
