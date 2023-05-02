interface QuoteExpiringProps {
  toName?: string | null;
  addressLine1: string;
  link: string;
  // product?: string;
}

export const quoteExpiringSoon = ({
  toName,
  addressLine1,
  link,
}: // product = 'flood',
QuoteExpiringProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
            <p>Your quote for ${addressLine1} expires in 24 hours. Please follow the link below if you would like to bind coverage.</p>
            <br>
            <div>
              <a href='${link}'>
                <p>View Quote</p>
              </a>
            </div>
            <br>
            <p style="padding-bottom: 8px">Thanks for throwing our hat in the ring. If the quote expires, you're always welcome to create a new one. Please reach out if you have any questions.</p>
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
