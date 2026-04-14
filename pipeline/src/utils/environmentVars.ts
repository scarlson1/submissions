import { defineString } from 'firebase-functions/params';

export const bigqueryDataset = defineString('BIGQUERY_DATASET', {
  default: 'submissions',
});
export const env = defineString('ENV', { default: 'dev' });
