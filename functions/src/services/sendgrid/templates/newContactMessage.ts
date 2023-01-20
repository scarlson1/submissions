interface NewContactMessageProps {
  toName?: string | null;
  fromEmail: string;
  body: string;
}

export const newContactMessage = ({ toName, fromEmail, body }: NewContactMessageProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
              <p>New submissions site contact message from: ${fromEmail}.</p>
            <div>
                <p>${body}</p>
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
