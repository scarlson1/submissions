import { error, info } from 'firebase-functions/logger';
import { ensureCollections } from '../services/typesense/index.js';

type TypesenseSetupRequest = {
  method: string;
  get(name: string): string | undefined;
};

type TypesenseSetupResponse = {
  json(body: unknown): void;
};

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

/**
 * Call this once after each deploy that includes schema changes:
 *   curl -X POST https://<region>-<project>.cloudfunctions.net/typesensesetup \
 *     -H "Authorization: Bearer $(gcloud auth print-identity-token)"
 *
 * The sync functions also call ensureCollections() on cold start as a
 * safety net, but migrations only run when this endpoint is called.
 * @param {TypesenseSetupRequest} req - Incoming HTTPS request
 * @param {TypesenseSetupResponse} res - Outgoing HTTPS response
 * @returns {Promise<void>} Resolves after Typesense collections are ensured
 */
export default async function typesensesetup(
  req: TypesenseSetupRequest,
  res: TypesenseSetupResponse,
): Promise<void> {
  info('Received Typesense setup request', {
    method: req.method,
    origin: req.get('origin') ?? null,
  });

  try {
    await ensureCollections();
    // await runMigrations();
    res.json({ ok: true });
  } catch (err: unknown) {
    error('Typesense setup failed', getErrorContext(err));
    throw err;
  }
}

// ```

// The reason to separate `ensureCollections` (called automatically) from `runMigrations` (called deliberately) is that migrations are intentional, ordered operations — you don't want them firing on every cold start as that could cause race conditions across multiple function instances warming up simultaneously.

// ## Summary of the flow
// ```
// Deploy new code
//       │
//       ▼
// Call /typesensesetup once
//       │  ensureCollections() — creates any missing collections
//       │  runMigrations()     — adds new fields to existing ones
//       ▼
// Function cold starts (sync, callables, etc.)
//       │
//       └─ ensureCollections() ──► _initialized = true, no-op thereafter
//                                   real HTTP only fires on first cold start
//                                   per instance
