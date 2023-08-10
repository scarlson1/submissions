import { HttpsError } from 'firebase-functions/v1/auth';

import { getReportErrorFn } from '../../../common';
import { BaseTemplateProps } from './sendContact';

const reportErr = getReportErrorFn('sendEmail');

export interface SendNewQuoteProps extends BaseTemplateProps {
  templateId: 'new_quote';
}

export async function sendNewQuote(sgKey: string, args: SendNewQuoteProps) {
  try {
    throw new Error('not implemented yet');
  } catch (err: any) {
    reportErr('error sending new quote notification', { ...args }, err);

    throw new HttpsError('unimplemented', 'send quote function not set up yet');
  }
}
