interface MoveToTenantConfirmationProps {
  toName?: string | null;
  toOrgName?: string | null;
  link: string;
}

export const moveToTenantConfirmation = ({
  toName,
  toOrgName,
  link,
}: MoveToTenantConfirmationProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
              <p>You recently attempted to sign in to a tenant. If this we not you, please ignore below. This is usually triggered if you currently have a regular user account and attempt to create an account within an organization using the same email. If you would like to proceed with moving your account to the organization, please click the link below.</p>
            <div>
              <a href="${link}">
                <p>Confirm mirgration to ${toOrgName || 'org'}</p>
              </a>
            </div>
            <div style="padding-top: 8px">
              <p>
                Cheers,<br>
                The iDemand team
              </p>
            </div>
          </div>
        </body>
      </html>
    </html>`;
};
