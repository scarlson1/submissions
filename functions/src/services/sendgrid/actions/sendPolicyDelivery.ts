import { HttpsError } from 'firebase-functions/v1/auth';

import { getReportErrorFn } from '../../../common/index.js';
import { BaseTemplateProps } from './sendContact.js';

const reportErr = getReportErrorFn('sendEmail');

export interface SendPolicyDeliveryProps extends BaseTemplateProps {
  templateId: 'policy_doc_delivery';
}

export async function sendPolicyDelivery(
  sgKey: string,
  args: SendPolicyDeliveryProps,
) {
  try {
    throw new Error('not implemented yet');
  } catch (err: unknown) {
    reportErr('error sending policy delivery notification', { ...args }, err);

    throw new HttpsError(
      'unimplemented',
      'send policy delivery function not set up yet',
    );
  }
}
