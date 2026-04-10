import type { Nullable } from '@idemand/common';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import { getReportErrorFn } from '../../common/index.js';

const reportErr = getReportErrorFn('pubSubHelper');

export function extractPubSubPayload<T extends Record<string, any>>(
  event: CloudEvent<MessagePublishedData<T>>,
  keys: (keyof T)[],
  throwIfFalsy?: boolean,
) {
  let payload: Partial<Nullable<T>> = {};

  try {
    for (let k of keys) {
      payload[k] = event.data?.message?.json
        ? event.data?.message?.json[k]
        : null;
    }
  } catch (err: any) {
    reportErr('Error extracting pubsub payload - invalid json', event, err);
  }

  if (throwIfFalsy) {
    keys.forEach((k) => {
      if (payload[k] === false || payload[k] === undefined)
        throw new Error(`pub sub payload missing ${k as string}`);
    });

    return payload as T; // Required<T>
  }

  return payload;
}
