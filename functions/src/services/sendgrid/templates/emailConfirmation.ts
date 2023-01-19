interface EmailConfirmationProps {
  toName?: string | null;
  link: string;
}

export const emailConfirmation = ({ toName, link }: EmailConfirmationProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
              <p>Please click the link below to confirm your email.</p>
            <div>
              <a href="${link}">
                <p>Confirm email</p>
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
