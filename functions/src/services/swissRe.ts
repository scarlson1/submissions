import axios from 'axios';
import { error } from 'firebase-functions/logger';
import querystring from 'querystring';
import {
  getReportErrorFn,
  swissReAccessTokenURL,
  swissReAuthScope,
  swissReProductCode,
  swissReToolCode,
} from '../common/index.js';

// TODO: use redis to store api token ??
// https://www.thedutchlab.com/insights/using-axios-interceptors-for-refreshing-your-api-token

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
      'SR-RNG-ProductCode': swissReProductCode.value(),
      'SR-RNG-LossModelToolCode': swissReToolCode.value(),
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  });

  swissReInstance.interceptors.request.use(
    // @ts-ignore
    async (config: any) => {
      // swissReInstance.defaults.headers.common.Authorization
      if (!config.headers) config.headers = {}; // TODO: check expiration time
      console.log('CONFIG: ', config); // TODO: delete (dont log key)
      if (!config.headers || !config.headers['Authorization']) {
        // console.log('GENERATING ACCESS TOKEN');
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
    async function (err: any) {
      // error('SR REQUEST ERROR => ', { ...err });
      reportErr(`SwissRe request error`, {}, err);

      const originalConfig = err.config;
      if (err.response) {
        if (err.response.status === 401 && !originalConfig._retry) {
          console.log('401 ERROR... GENERATING NEW ACCESS TOKEN');
          originalConfig._retry = true;
          // let config = err.config;

          try {
            let accessToken = await generateSRAccessToken(clientId, clientSecret);

            if (accessToken)
              swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            // Does new token also need to be set on config (originalConfig.headers.Authorization = token) ??
            // return swissReInstance(config);
            return swissReInstance(originalConfig);
          } catch (err) {
            return Promise.reject(err);
          }
        }
        if (err.response.status === 403 && !originalConfig._retry) {
          console.log('403 ERROR... GENERATING NEW ACCESS TOKEN');
          originalConfig._retry = true;
          // let config = err.config;

          try {
            let accessToken = await generateSRAccessToken(clientId, clientSecret);

            if (accessToken)
              swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            return swissReInstance(originalConfig);
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
    const authScope = swissReAuthScope.value();
    const srAuthURL = swissReAccessTokenURL.value();

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
