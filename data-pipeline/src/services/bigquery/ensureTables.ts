import { info } from 'firebase-functions/logger';
import { getBigQueryClient } from '../../../../data-pipeline/src/services/bigquery/client.js';
import { env } from '../../utils/environmentVars.js';
import type { TableConfig } from './schemas.js';

// Example: https://github.com/googleapis/nodejs-bigquery/blob/main/samples/createTablePartitioned.js

// let x: ITable & {
//   name?: string;
//   schema?: string | TableField[] | TableSchema;
//   partitioning?: string;
//   view?: string | ViewDefinition;
// } = {};

// move to env var ??
const PARTITION_EXPIRY_MS = {
  dev: 7_776_000_000, // 90 days
  prod: undefined, // no expiry
};

export async function ensureTables(datasetId: string, tables: TableConfig[]) {
  const bq = getBigQueryClient();
  const dataset = bq.dataset(datasetId);
  const [datasetExists] = await dataset.exists();
  if (!datasetExists) {
    await dataset.create();
  }

  for (let {
    tableId,
    schema,
    partitionField,
    clusterFields,
    description,
  } of tables) {
    const tableRef = dataset.table(tableId);
    const [exists] = await tableRef.exists();

    const options = {
      schema,
      timePartitioning: {
        type: 'DAY',
        field: partitionField,
        expirationMs: PARTITION_EXPIRY_MS[env.value()],
      },
      description: description,
      clustering: {
        fields: clusterFields,
      },
      requirePartitionFilter: env.value() === 'prod', // enforce partition pruning in prod
    };

    if (!exists) {
      const [table] = await dataset.createTable(tableId, options);

      info(`Table ${table.id} created with clustering:`);
      info(table.metadata.clustering);
    }
  }
}
