export const adminNewAgencySubmission = ({ link, orgName }: { link: string; orgName: string }) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi,</p>
            <p>New agency submission: ${orgName}.</p>
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
