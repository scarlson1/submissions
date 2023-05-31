interface BlankHTMLProps {
  toName?: string | null;
  content: string;
}

export const blankHTML = ({ toName, content }: BlankHTMLProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
            <div>${content}</div>
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
