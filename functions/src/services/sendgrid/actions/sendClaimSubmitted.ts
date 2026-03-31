import { HttpsError } from 'firebase-functions/v1/auth';

// import { audience } from '../../../common/environmentVars';
import { Resend } from 'resend';
import { EmailTemplate, getReportErrorFn } from '../../../common/index.js';
import { claimSubmittedHTML } from '../templates/claimSubmitted.js';
import { BaseTemplateProps } from './sendContact.js';

export interface SendClaimSubmittedProps extends Omit<BaseTemplateProps, 'to'> {
  to: string | string[];
  templateId: 'claim_submitted';
  policyId: string;
  claimId: string;
  locationId: string;
  externalId?: string | null;
  // submittedDate: string;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    preferredMethod: 'email' | 'phone';
  };
  // TODO: add agent / named insured info
  // TODO: add description of damage ??
}

const reportErr = getReportErrorFn('sendClaimSubmitted');

export async function sendClaimSubmitted(
  key: string,
  args: SendClaimSubmittedProps,
) {
  try {
    const { to, policyId, locationId } = args;
    const html = claimSubmittedHTML({ ...args });

    const resend = new Resend(key);

    const { data, error } = await resend.emails.send({
      from: 'iDemand Insurance <noreply@s-carlson.com>',
      to,
      subject: 'Claim Submission Confirmation',
      html,
      tags: [
        {
          name: 'emailType',
          value: EmailTemplate.enum.claim_submitted,
        },
        {
          name: policyId,
          value: policyId,
        },
        {
          name: 'locationId',
          value: locationId,
        },
      ],
    });

    return {
      emails: to,
      id: data.id || null,
      error: error.message || null,
    };
  } catch (err: unknown) {
    reportErr('error sending claim submitted email', {}, err);

    throw new HttpsError('internal', 'failed to deliver notification');
  }
}
