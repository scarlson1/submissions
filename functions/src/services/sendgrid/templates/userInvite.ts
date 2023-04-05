interface UserInviteProps {
  toName?: string | null;
  fromName?: string | null;
  link: string;
}

export const userInvite = ({ toName, fromName, link }: UserInviteProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
            ${
              fromName
                ? `<p>${fromName} has invited you to create an account at iDemand Insurance. Click the link below to get started!</p>`
                : "<p>You've been invited to create an account at iDemand Insurance. Click the link below to get started</p>"
            }
            <div>
              <a href="${link}">
                <p>Accept Invite</p>
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
