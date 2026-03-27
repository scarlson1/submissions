// functions/src/index.ts (additions)

import { onRequest } from 'firebase-functions/v2/https';
import { ensureCollections } from '../services/typesense';

/**
 * Call this once after each deploy that includes schema changes:
 *   curl -X POST https://<region>-<project>.cloudfunctions.net/typesensesetup \
 *     -H "Authorization: Bearer $(gcloud auth print-identity-token)"
 *
 * The sync functions also call ensureCollections() on cold start as a
 * safety net, but migrations only run when this endpoint is called.
 */
const typesensesetup = onRequest(
  { invoker: 'private' }, // only callable with a valid GCP identity token
  async (req, res) => {
    await ensureCollections();
    // await runMigrations();
    res.json({ ok: true });
  },
);

export default typesensesetup;

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
