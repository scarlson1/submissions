interface PoliicyDeliveryProps {
  toName?: string;
  addressName?: string;
}

export const policyDelivery = ({ toName, addressName }: PoliicyDeliveryProps) => {
  return `<!doctype html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        </head>
        <body>
          <div>
            <p style="padding-bottom: 8px">Hi${toName ? ` ${toName},` : ','}</p>
            <p>We're excited to have you with us!</p>
            
            <p>Your new policy ${
              addressName ? `for ${addressName} ` : ''
            }is attached below. It's not be the most interesting read, but it does contain important details you may want to know.</p>

            <p>If you have any questions, please don't hesitate to reach out.</p>
            
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
