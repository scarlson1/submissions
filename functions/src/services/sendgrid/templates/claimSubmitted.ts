import { hostingBaseURL } from '../../../common/environmentVars.js';

export interface ClaimSubmittedProps {
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
}

export const claimSubmittedHTML = ({
  policyId,
  claimId,
  locationId,
  externalId,
  contact,
}: ClaimSubmittedProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi,</p>
            <p style="padding-bottom: 4px">We've very sorry to hear about your damage. We know how stressful this event may be and we'll do everything we can to get your claim processed as quickly and fairly as possible.</p>
            <p style="padding-bottom: 4px">A member of our claims team will reach out to ${
              contact?.firstName || 'preferred contact'
            } at ${contact?.preferredMethod === 'phone' ? contact?.phone : contact.email}.</p>
            <p style="padding-bottom: 2px">Claim ID: <a href='${hostingBaseURL.value()}/claims/${policyId}/${claimId}'>${claimId}</a></p>
            <p style="padding-bottom: 2px">Policy ID: <a href='${hostingBaseURL.value()}/claims/${policyId}/${claimId}'>${policyId}</a></p>
            <p style="padding-bottom: 2px">Location ID: ${externalId || locationId}</p>
            <div style="padding-top: 8px">
              <p>
                Cheers,<br />
                The iDemand team
              </p>
            </div>
          </div>
        </body>
      </html>
    </html>`;
};

//<p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
