import { BigQuery } from '@google-cloud/bigquery';
import { projectID } from 'firebase-functions/params';

let _client: BigQuery | undefined;

export function getBigQueryClient() {
  if (_client) return _client;

  _client = new BigQuery({
    projectId: projectID.value(),
  });

  return _client;
}
