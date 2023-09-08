interface AdminImportNotificationProps {
  link?: string | null | undefined;
  successCount: number;
  errorCount: number;
  invalidDataCount: number;
  fileName: string;
  toName?: string | null;
}

export const adminImportNotification = ({
  link,
  successCount,
  errorCount,
  invalidDataCount,
  fileName,
  toName,
}: AdminImportNotificationProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
            <p>Import staging complete from ${fileName}.</p>
            <p>Imported ${successCount} record${
    successCount > 2 ? 's' : ''
  } with ${errorCount} record creation errors and ${invalidDataCount} rows skipped due to invalid data.</p>
            <p>The records are now in "staged" collection. To complete the import, you must review and approve.</p>

            ${
              link
                ? `<div>
                    <a href='${link}'>
                      <p>Review Import Summary Doc</p>
                    </a>
                  </div>`
                : ''
            }
            
            
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
