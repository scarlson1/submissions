import { error } from 'firebase-functions/logger';
import { FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';

import { publishPolicyCreated } from '../services/pubsub';
import { reportErrorSentry } from '../services/sentry';

export default async (
  event: FirestoreEvent<
    QueryDocumentSnapshot | undefined,
    {
      policyId: string;
    }
  >
) => {
  const policyId = event.params.policyId;

  try {
    await publishPolicyCreated({
      policyId,
    });
  } catch (err: any) {
    reportError(`Error publishing policy.created pubsub event`, { policyId }, err);
  }
};

export function reportError(msg: string, ctx: Record<string, any> = {}, err: any = null) {
  error(msg, { ...ctx, err });
  reportErrorSentry(err || msg, { func: 'policyCreated', msg, ...ctx });
}
