import { PUB_SUB_TOPICS } from '@idemand/common';
import { publishMessage } from './publishMessage.js';

export interface ReconciliationErrorPayload {
  reportId: string;
}

export function publishReconciliationError(
  payload: ReconciliationErrorPayload,
) {
  return publishMessage(PUB_SUB_TOPICS.TAX_RECONCILIATION_ERROR, payload);
}
