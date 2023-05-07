interface AgencyAppApprovedProps {
  link: string;
  firstName?: string | null;
  orgName: string;
  message?: string | null;
}

export const agencyAppApproved = ({
  link,
  firstName,
  orgName,
  message,
}: AgencyAppApprovedProps) => {
  let body =
    message ??
    `Your submission has been processed and approved for ${orgName}.  We're exciting to work with you! Please click the link below to finish setting up your account and inviting your colleagues.`;

  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${firstName ? ` ${firstName},` : ','}</p>
            <p>${body}</p>
            <br>
            <p>
              <a href=${link}>Finish setting up your account</a>
            </p>
            <br>
            <p>If you have any questions, please reply to this email.</p>
            <br>
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
