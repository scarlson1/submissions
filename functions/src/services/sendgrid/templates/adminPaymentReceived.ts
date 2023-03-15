interface AdminPaymentReceivedProps {
  policyLink: string;
  policyId: string;
  transactionLink: string;
  transactionId: string;
}

export const adminPaymentReceived = ({
  policyLink,
  policyId,
  transactionLink,
  transactionId,
}: AdminPaymentReceivedProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi,</p>
            <p>Payment received for policy ${policyId}. Click the link below to upload and deliver the policy documents to the insured.</p>
            <div>
              <a href='${policyLink}'>
                <p>Upload policy documents</p>
              </a>
            </div>

            <div>
              <a href='${transactionLink}'>
                <p>Review transaction ${transactionId}</p>
              </a>
            </div>
            
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
