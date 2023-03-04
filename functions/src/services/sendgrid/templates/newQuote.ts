interface SubmissionReceivedProps {
  toName?: string | null;
  addressLine1?: string;
  link: string;
  product?: string;
}

export const newQuote = ({
  toName,
  addressLine1,
  link,
  product = 'flood',
}: SubmissionReceivedProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
            <p>Please follow the link below to see your ${product} coverage quote${
    addressLine1 ? ' for ' + addressLine1 : ''
  }.</p>
            <br>
            <div>
              <a href='${link}'>
                <p>View Quote</p>
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
