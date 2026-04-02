// functions/src/typesense/ensureCollections.ts

import { error, info } from 'firebase-functions/logger';
import type { CollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import {
  typesenseHost,
  typesensePort,
  typesenseProtocol,
} from '../../common/environmentVars.js';
import { getTypesenseClient } from './client.js';
import {
  // claimsSchema,
  financialTrxSchema,
  locationsSchema,
  orgsSchema,
  policiesSchema,
  quotesSchema,
  submissionsSchema,
  usersSchema,
} from './schema.js';

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
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'httpStatus' in err &&
      err.httpStatus === 404
    ) {
      await client.collections().create(schema);
      info(`Typesense collection "${schema.name}" created`);
    } else {
      error(`Typesense collection "${schema.name}" ensure failed`, {
        ...getErrorContext(err),
        host: typesenseHost.value(),
        port: typesensePort.value(),
        protocol: typesenseProtocol.value(),
      });
      // Unexpected error (auth failure, network, etc.) — let it surface
      throw err;
    }
  }
}

const schemas = [
  usersSchema,
  // claimsSchema,
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

  info('Ensuring Typesense collections', {
    host: typesenseHost.value(),
    port: typesensePort.value(),
    protocol: typesenseProtocol.value(),
    collectionCount: schemas.length,
  });

  await Promise.all(schemas.map(ensureCollection));
  _initialized = true;

  info('All Typesense collections verified');
}
