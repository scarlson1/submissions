import { isObject } from 'lodash-es';

interface AdminChangeRequestProps {
  link: string;
  toName?: string | null;
  requestType: string;
  entityId: string;
  changes: Record<string, any>;
}

export const adminChangeRequest = ({
  link,
  toName,
  requestType,
  entityId,
  changes,
}: AdminChangeRequestProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
            <p>Change request type: ${requestType}</p>
            <p>RecordId: ${entityId}</p>
            <p>Changes:</p>
            <ul>
              ${Object.keys(changes).map(
                (key) =>
                  `<li key={${key}}>${key} --> ${
                    isObject(changes[key]) ? JSON.stringify(changes[key], null, 2) : changes[key]
                  }</li>`
              )}
            </ul>
            <div>
              <a href='${link}'>
                <p>Review request</p>
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
