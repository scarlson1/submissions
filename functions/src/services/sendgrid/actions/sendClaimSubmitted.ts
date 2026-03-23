import sgMail from '@sendgrid/mail';
import { HttpsError } from 'firebase-functions/v1/auth';

// import { audience } from '../../../common/environmentVars';
import { EmailTemplates, getReportErrorFn } from '../../../common/index.js';
import { claimSubmittedHTML } from '../templates/claimSubmitted.js';
import { BaseTemplateProps } from './sendContact.js';

export interface SendClaimSubmittedProps extends BaseTemplateProps {
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
  sgKey: string,
  args: SendClaimSubmittedProps,
) {
  try {
    const { to, policyId, locationId } = args;
    sgMail.setApiKey(sgKey);
    const html = claimSubmittedHTML({ ...args });

    // const to = ['spencer@s-carlson.com'];
    // if (audience.value() !== 'LOCAL HUMANS') to.push('noreply@s-carlson.com');
    await sgMail.send({
      html,
      subject: `Claim submission confirmation`,
      to,
      from: 'hello@idemandinsurance.com', // TODO: use claims@idemandinsurance.com (set up DKIM records)
      customArgs: {
        emailType: EmailTemplates.enum.claim_submitted,
        policyId,
        locationId,
      },
    });

    return {
      emails: to,
    };
  } catch (err: any) {
    reportErr('error sending claim submitted email', {}, err);

    throw new HttpsError('internal', 'failed to deliver notification');
  }
}
