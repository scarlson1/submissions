import { HttpsError } from 'firebase-functions/v1/auth';

import { getReportErrorFn } from '../../../common/index.js';
import { BaseTemplateProps } from './sendContact.js';

export interface SendAgencyApprovedProps extends BaseTemplateProps {
  templateId: 'agency_approved';
  docId: string;
  tenantId: string;
  message?: string | null;
}

const reportErr = getReportErrorFn('sendEmail');

export async function sendAgencyApproved(
  key: string,
  args: SendAgencyApprovedProps,
) {
  try {
    throw new Error('no set up yet');
  } catch (err: unknown) {
    reportErr('error sending agency approved notification', {}, err);

    throw new HttpsError(
      'internal',
      'error sending agency approved notification',
    );
  }
}
