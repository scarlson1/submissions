import axios from 'axios';
import querystring from 'querystring';

import { getSecret } from './secretManager.js';

export const generateSRAccessToken = () => {
  return new Promise<string>(async (resolve, reject) => {
    const clientId: string | undefined = await getSecret('SWISS_RE_CLIENT_ID');
    const clientSecret: string | undefined = await getSecret(
      'SWISS_RE_CLIENT_SECRET',
    );
    const authScope: string | undefined = process.env.SWISS_RE_AUTH_SCOPE;
    const srAuthURL: string | undefined = process.env.SWISS_RE_ACCESS_TOKEN_URL;

    if (!(clientId && clientSecret && authScope && srAuthURL)) {
      reject('Missing api credentials in Google Secret Manager or env vars.');
      return;
    }

    const reqBody = {
      client_id: clientId,
      client_secret: clientSecret,
      scope: authScope,
      grant_type: 'client_credentials',
    };

    const { data } = await axios.post(
      srAuthURL,
      querystring.stringify(reqBody),
    );

    resolve(data.access_token);
  });
};
