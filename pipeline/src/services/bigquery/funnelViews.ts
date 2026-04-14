import type { ViewConfig } from './views.js';

// ---------------------------------------------------------------------------
// Query builders
// ---------------------------------------------------------------------------

/**
 * One row per submission, joined to the submission's "best" quote and that
 * quote's bound policy.
 *
 * "Best" quote selection (via ROW_NUMBER):
 *   1. A bound quote wins over any unbound quote.
 *   2. Among ties, the most recently published quote wins.
 *   3. Last tiebreak: latest _ingested_at (handles re-ingested rows).
 *
 * reached_quote  — true if any quote was created for this submission
 * reached_policy — true if that quote was subsequently bound
 */
function submissionToPolicyQuery(projectId: string, datasetId: string) {
  const ref = (view: string) => `\`${projectId}.${datasetId}.${view}\``;
  return `\
WITH best_quote AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY submission_id
      ORDER BY
        CASE WHEN status = 'bound' THEN 0 ELSE 1 END,
        quote_published_date DESC NULLS LAST,
        _ingested_at DESC
    ) AS _rn
  FROM ${ref('v_quotes')}
  WHERE submission_id IS NOT NULL
)
SELECT
  -- Submission
  s._id                  AS submission_id,
  s.agency.org_id        AS org_id,
  s._ingested_at         AS submitted_at,
  s.product,
  s.address.state        AS state,
  s.comm_source,
  s.annual_premium       AS submission_premium,

  -- Quote (NULL when no quote exists)
  q._id                  AS quote_id,
  q._ingested_at         AS quote_created_at,
  q.quote_published_date,
  q.status               AS quote_status,
  q.annual_premium       AS quoted_premium,

  -- Policy (NULL when quote was never bound)
  q.policy_id,
  p._ingested_at         AS policy_created_at,
  p.effective_date       AS policy_effective_date,
  p.term_premium,
  p.payment_status,

  -- Funnel stage flags
  q._id IS NOT NULL      AS reached_quote,
  p._id IS NOT NULL      AS reached_policy
FROM ${ref('v_submissions')} s
LEFT JOIN best_quote q
  ON q.submission_id = s._id AND q._rn = 1
LEFT JOIN ${ref('v_policies')} p
  ON p._id = q.policy_id`;
}

/**
 * Daily aggregate of funnel metrics, broken down by product / state /
 * comm_source. Reads from v_funnel_submission_to_policy so the dedup and
 * join logic lives in exactly one place.
 */
function funnelDailyQuery(projectId: string, datasetId: string) {
  const ref = (view: string) => `\`${projectId}.${datasetId}.${view}\``;
  return `\
SELECT
  DATE(submitted_at)                                                AS date,
  product,
  state,
  comm_source,
  COUNT(*)                                                          AS submissions,
  COUNTIF(reached_quote)                                            AS quoted,
  COUNTIF(reached_policy)                                           AS bound,
  SAFE_DIVIDE(COUNTIF(reached_quote),  COUNT(*))                    AS sub_to_quote_rate,
  SAFE_DIVIDE(COUNTIF(reached_policy), COUNTIF(reached_quote))      AS quote_to_bound_rate,
  SAFE_DIVIDE(COUNTIF(reached_policy), COUNT(*))                    AS overall_conversion_rate,
  AVG(IF(reached_policy, term_premium, NULL))                       AS avg_bound_premium
FROM ${ref('v_funnel_submission_to_policy')}
GROUP BY date, product, state, comm_source`;
}

// ---------------------------------------------------------------------------
// View registry
// ---------------------------------------------------------------------------

export const FUNNEL_VIEW_CONFIGS: ViewConfig[] = [
  {
    viewId: 'v_funnel_submission_to_policy',
    query: submissionToPolicyQuery,
    description:
      'One row per submission joined to its best quote and bound policy. ' +
      'reached_quote / reached_policy flags drive all downstream funnel analysis.',
  },
  {
    viewId: 'v_funnel_daily',
    query: funnelDailyQuery,
    description:
      'Daily funnel aggregates (submissions → quoted → bound) broken down by ' +
      'product, state, and comm_source.',
  },
];
