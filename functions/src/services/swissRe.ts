import axios from 'axios';
import { error } from 'firebase-functions/logger';
import querystring from 'querystring';
import { getReportErrorFn } from '../common/index.js';

const reportErr = getReportErrorFn('swissRe');

export const getSwissReInstance = (
  clientId: string,
  clientSecret: string,
  subscriptionKey: string
) => {
  const swissReInstance = axios.create({
    baseURL: process.env.SWISS_RE_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'SR-RNG-ProductCode': process.env.SWISS_RE_PRODUCT_CODE,
      'SR-RNG-LossModelToolCode': process.env.SWISS_RE_TOOL_CODE,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  });

  swissReInstance.interceptors.request.use(
    // @ts-ignore
    async (config: any) => {
      if (!config.headers) config.headers = {}; // TODO: check expiration time
      if (!config.headers || !config.headers['Authorization']) {
        console.log('GENERATING ACCESS TOKEN');
        try {
          const accessToken = await generateSRAccessToken(clientId, clientSecret);

          config.headers['Authorization'] = `Bearer ${accessToken}`;
          swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (err) {
          return Promise.reject(err);
        }
      }

      return config;
    },
    (err) => {
      error('Axios request interceptor error => ', err.response);
      return Promise.reject(err);
    }
  );

  swissReInstance.interceptors.response.use(
    (res) => {
      return res;
    },
    async (err: any) => {
      // error('SR REQUEST ERROR => ', { ...err });
      reportErr(`SwissRe request error`, {}, err);

      const originalConfig = err.config;
      if (err.response) {
        if (err.response.status === 401 && !originalConfig._retry) {
          console.log('401 ERROR... GENERATING NEW ACCESS TOKEN');
          originalConfig._retry = true;
          let config = err.config;

          try {
            let accessToken = await generateSRAccessToken(clientId, clientSecret);

            if (accessToken)
              swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            return swissReInstance(config);
          } catch (err) {
            return Promise.reject(err);
          }
        }
        if (err.response.status === 403 && !originalConfig._retry) {
          console.log('403 ERROR... GENERATING NEW ACCESS TOKEN');
          originalConfig._retry = true;
          let config = err.config;

          try {
            let accessToken = await generateSRAccessToken(clientId, clientSecret);

            if (accessToken)
              swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            return swissReInstance(config);
          } catch (err) {
            return Promise.reject(err);
          }
        }
      }

      return Promise.reject(err);
    }
  );

  return swissReInstance;
};

export function generateSRAccessToken(clientId: string, clientSecret: string) {
  return new Promise<string>(async (resolve, reject) => {
    const authScope = process.env.SWISS_RE_AUTH_SCOPE; // TODO: use firebase env vars
    const srAuthURL = process.env.SWISS_RE_ACCESS_TOKEN_URL;

    if (!(clientId && clientSecret && authScope && srAuthURL)) {
      reject(new Error('Missing api credentials in Google Secret Manager or env vars.'));
      return;
    }

    const reqBody = {
      client_id: clientId,
      client_secret: clientSecret,
      scope: authScope,
      grant_type: 'client_credentials',
    };

    console.log('GENERATING SR ACCESS TOKEN...');
    const { data } = await axios.post(srAuthURL, querystring.stringify(reqBody));
    console.log('GENERATED NEW SR ACCESS TOKEN');

    resolve(data.access_token);
  });
}
