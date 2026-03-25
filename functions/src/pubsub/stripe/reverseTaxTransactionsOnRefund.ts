import { info } from 'firebase-functions/logger';
import { CloudEvent } from 'firebase-functions/v2';
import { MessagePublishedData } from 'firebase-functions/v2/pubsub';
import { getReportErrorFn } from '../../common/index.js';
import { createTaxTrxReversal } from '../../modules/taxes/createTaxReversalTrx.js';
import { verify } from '../../utils/validation.js';
import { extractPubSubPayload } from '../utils/extractPubSubPayload.js';
import { RefundCreatedPayload } from './reverseTransfersOnRefund.js';

// TODO: need to update stripe refund metadata to include tax refund amounts ??

const reportErr = getReportErrorFn('reverseTaxTransactionsOnRefund');

export default async (
  event: CloudEvent<MessagePublishedData<RefundCreatedPayload>>,
) => {
  info('STRIPE REFUND EVENT (reverse tax transactions listener) - MSG JSON: ', {
    ...(event.data?.message?.json || {}),
  });

  const { refund } = extractPubSubPayload(event, ['refund']);

  try {
    verify(refund, 'pub sub payload missing refund object');
    info('refund.created data [create tax reversal transactions]: ', refund);

    const commitRes = await createTaxTrxReversal(refund);

    info(
      `tax reversal transactions successfully created (${commitRes.length} records)`,
    );
  } catch (err: unknown) {
    const msg = 'error creating transfers on charge.succeeded';

    reportErr(msg, { ...event }, err);
  }

  return;
};
