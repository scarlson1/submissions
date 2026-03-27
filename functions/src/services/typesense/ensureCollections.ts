// functions/src/typesense/ensureCollections.ts

import { info } from 'firebase-functions/logger';
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import { getTypesenseClient } from './client.js';
import {
  financialTrxSchema,
  locationsSchema,
  orgsSchema,
  policiesSchema,
  quotesSchema,
  submissionsSchema,
  usersSchema,
} from './schema.js';

/**
 * Creates a Typesense collection if it does not already exist.
 * Safe to call on every cold start — does nothing if the collection
 * is already present.
 * @param {CollectionCreateSchema} schema - typesense Collection schema
 * @returns {void}
 */
async function ensureCollection(schema: CollectionCreateSchema): Promise<void> {
  const client = getTypesenseClient();

  try {
    await client.collections(schema.name).retrieve();
    info(`Typesense collection "${schema.name}" already exists — skipping`);
  } catch (err: any) {
    if (err?.httpStatus === 404) {
      await client.collections().create(schema);
      info(`Typesense collection "${schema.name}" created`);
    } else {
      // Unexpected error (auth failure, network, etc.) — let it surface
      throw err;
    }
  }
}

const schemas = [
  usersSchema,
  policiesSchema,
  quotesSchema,
  submissionsSchema,
  orgsSchema,
  locationsSchema,
  financialTrxSchema,
];

let _initialized = false;

/**
 * Ensures all Typesense collections exist. Idempotent — safe to call
 * multiple times; only runs once per process lifetime due to the
 * in-memory flag.
 * @returns {void}
 */
export async function ensureCollections(): Promise<void> {
  if (_initialized) return;

  await Promise.all(schemas.map(ensureCollection));
  _initialized = true;

  info('All Typesense collections verified');
}
