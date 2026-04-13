import type { Table } from '@google-cloud/bigquery';
import { error as logError, info } from 'firebase-functions/logger';

/**
 * A raw row as expected by BigQuery's streaming insert API when `raw: true`.
 * The `insertId` drives BQ's ~1-minute at-least-once deduplication window.
 */
interface RawRow<T> {
  insertId: string;
  json: T;
}

/**
 * Streams an array of rows to a BigQuery table using the Storage Write
 * streaming insert API (`/insertAll`).
 *
 * Design decisions:
 *  - Uses `raw: true` so we control the `insertId` per row rather than
 *    getting a random UUID assigned by the client. Callers compose the
 *    insertId from stable document fields (e.g. `${id}_${_doc_version}`)
 *    so the same Firestore event cannot produce duplicate BQ rows within
 *    the deduplication window.
 *  - Partial failures (some rows rejected, others accepted) are logged and
 *    re-thrown as a single error. BQ streaming inserts are not transactional,
 *    so a partial failure means some rows landed. Callers should treat this
 *    as an alert rather than a safe retry target — retrying naively would
 *    duplicate the rows that already succeeded.
 *  - Returns early on an empty array rather than making a round-trip that
 *    would throw ('You must provide at least 1 row').
 *
 * @param table       A BigQuery Table instance (from `dataset.table(id)`).
 * @param rows        Typed row objects matching the table's schema.
 * @param insertIdFn  Pure function that derives a stable string key from a row.
 *                    Should be collision-free within the deduplication window.
 */
export async function streamRows<T extends object>(
  table: Table,
  rows: T[],
  insertIdFn: (row: T) => string,
): Promise<void> {
  if (rows.length === 0) return;

  const rawRows: RawRow<T>[] = rows.map((row) => ({
    insertId: insertIdFn(row),
    json: row,
  }));

  try {
    await table.insert(rawRows, { raw: true });
    info(`streamRows: inserted ${rows.length} row(s) into ${table.id}`);
  } catch (err: any) {
    // The BQ client throws a PartialFailureError when at least one row was
    // rejected. It carries an `errors` array with per-row details.
    if (err?.name === 'PartialFailureError' && Array.isArray(err.errors)) {
      const details = err.errors.map((e: any) => ({
        insertId: e.row?.insertId ?? null,
        errors: e.errors,
      }));
      logError(
        `streamRows: partial failure inserting into ${table.id} ` +
          `(${err.errors.length} rejected of ${rows.length} total)`,
        { table: table.id, failures: details },
      );
    } else {
      logError(`streamRows: insert failed for table ${table.id}`, {
        table: table.id,
        message: err?.message ?? String(err),
      });
    }
    throw err;
  }
}
