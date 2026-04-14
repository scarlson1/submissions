import { error } from 'firebase-functions/logger';
import { ensureTables } from '../services/bigquery/ensureTables.js';
import { TABLE_CONFIGS } from '../services/bigquery/schemas.js';
import { bigqueryDataset } from '../utils/environmentVars.js';

function getErrorContext(err: unknown) {
  if (err instanceof Error) {
    return {
      message: err.message,
      code: 'code' in err ? err.code : null,
      httpStatus: 'httpStatus' in err ? err.httpStatus : null,
    };
  }

  return {
    message: 'unknown error',
    code: null,
    httpStatus: null,
  };
}

// TODO: use express and add requireClaim(['iDemandAdmin']) middleware

export default async function bigquerySetup(req, res): Promise<void> {
  try {
    await ensureTables(bigqueryDataset.value(), TABLE_CONFIGS);
    res.send({ ok: true });
  } catch (err: unknown) {
    error('BigQuery setup failed', getErrorContext(err));
    throw err;
  }
}
