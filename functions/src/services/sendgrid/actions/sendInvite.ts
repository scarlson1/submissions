import { HttpsError } from 'firebase-functions/v1/auth';

import { getReportErrorFn } from '../../../common/index.js';
import { BaseTemplateProps } from './sendContact.js';

export interface SendInviteProps extends BaseTemplateProps {
  templateId: 'invite';
}

const reportErr = getReportErrorFn('sendEmail');

export async function sendInvite(sgKey: string, args: SendInviteProps) {
  try {
    throw new Error('not implemented yet');
  } catch (err: any) {
    reportErr('error sending invite notification', { ...args }, err);

    throw new HttpsError('unimplemented', 'send invite function not set up yet');
  }
}
