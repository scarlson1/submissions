import axios from 'axios';
import FormData from 'form-data';
import { signNowBaseURL } from '../common/index.js';

export const getSignNowInstance = (
  basicAuthToken: string,
  accountEmail: string,
  accountPW: string
) => {
  const signNowInstance = axios.create({
    baseURL: signNowBaseURL.value(),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  signNowInstance.interceptors.request.use(
    // @ts-ignore
    async (config: any) => {
      if (!config.headers) config.headers = {};
      if (!config.headers || !config.headers['Authorization']) {
        console.log('GENERATING ACCESS TOKEN');
        try {
          const accessToken = await generateSNAccessToken(basicAuthToken, accountEmail, accountPW);

          // console.log('ACCESS TOKEN => ', accessToken);
          config.headers['Authorization'] = `Bearer ${accessToken}`;
          signNowInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (err) {
          return Promise.reject(err);
        }
      }

      return config;
    },
    (err) => {
      // console.log('Axios request interceptor error => ', err.response);
      return Promise.reject(err);
    }
  );

  signNowInstance.interceptors.response.use(
    (res) => {
      return res;
    },
    async (err) => {
      // console.log('ERROR => ', err);
      const originalConfig = err.config;
      if (err.response) {
        if (err.response.status === 401 && !originalConfig._retry) {
          console.log('401 ERROR... GENERATING NEW ACCESS TOKEN');
          originalConfig._retry = true;
          let config = err.config;

          try {
            let accessToken = await generateSNAccessToken(basicAuthToken, accountEmail, accountPW);
            // console.log('REFRESHED TOKEN => ', accessToken);

            if (accessToken)
              signNowInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            return signNowInstance(config);
          } catch (err) {
            return Promise.reject(err);
          }
        }
        if (err.response.status === 403 && !originalConfig._retry) {
          console.log('403 ERROR... GENERATING NEW ACCESS TOKEN');
          originalConfig._retry = true;
          let config = err.config;

          try {
            let accessToken = await generateSNAccessToken(basicAuthToken, accountEmail, accountPW);

            if (accessToken)
              signNowInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            return signNowInstance(config);
          } catch (err) {
            return Promise.reject(err);
          }
        }
      }

      return Promise.reject(err);
    }
  );

  return signNowInstance;
};

function generateSNAccessToken(basicAuthToken: string, accountEmail: string, accountPW: string) {
  return new Promise<string>(async (resolve, reject) => {
    if (!(accountEmail && accountPW)) {
      reject(new Error('Missing api credentials in Secret Manager.'));
      return;
    }

    const authURL = `${signNowBaseURL.value()}/oauth2/token`;

    // const reqBody = {
    //   grant_type: 'password',
    //   username: accountEmail,
    //   password: accountPW,
    //   scope: '*',
    // };
    const form = new FormData();
    form.append('grant_type', 'password');
    form.append('username', accountEmail);
    form.append('password', accountPW);
    form.append('scope', '*');

    const { data } = await axios.post(authURL, form, {
      headers: {
        // Accept: `application/json`,
        Authorization: `Basic ${basicAuthToken}`,
        'content-type': 'multipart/form-data',
      },
    });

    resolve(data.access_token);
  });
}
