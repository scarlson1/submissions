interface SubmissionReceivedProps {
  toName?: string | null;
  addressLine1?: string;
}

export const submissionReceived = ({ toName, addressLine1 }: SubmissionReceivedProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
            <p>We've received your submission${
              addressLine1 ? ' for ' + addressLine1 : ''
            }. Please keep an eye out for a follow up email coming your way.</p>
            
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
