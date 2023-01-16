interface AdminNewSubmissionProps {
  link: string;
  toName?: string | null;
  addressLine1?: string;
  city?: string;
  state?: string;
  // postal?: string | number;
}

export const adminNewSubmission = ({
  link,
  toName,
  addressLine1,
  city,
  state,
}: AdminNewSubmissionProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
            <p>New submission: ${
              addressLine1 ? getFormattedAddr({ addressLine1, city, state }) : ''
            }.</p>
            <div>
              <a href='${link}'>
                <p>Review Submission</p>
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

interface GetFormattedAddrProps {
  addressLine1: string;
  city?: string;
  state?: string;
}

function getFormattedAddr({ addressLine1, city, state }: GetFormattedAddrProps) {
  return `${addressLine1} ${city ? city + ' ,' : ''} ${state}`;
}
