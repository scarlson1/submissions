// import axios, { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import querystring from 'querystring';

// const spatialKeyTokenURL = `https://idemand.spatialkey.com/SpatialKeyFramework/api/v2/oauth.json?grant_type=${param1}&assertion=${param2}`

export const getSwissReInstance = (clientId: string, clientSecret: string) => {
  const swissReInstance = axios.create({
    baseURL: process.env.SWISS_RE_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'SR-RNG-ProductCode': process.env.SWISS_RE_PRODUCT_CODE,
      'SR-RNG-LossModelToolCode': process.env.SWISS_RE_TOOL_CODE,
      'Ocp-Apim-Subscription-Key': process.env.SWISS_RE_SUBSCRIPTION_KEY,
    },
  });

  swissReInstance.interceptors.request.use(
    // @ts-ignore
    async (config: any) => {
      if (!config.headers) config.headers = {};
      if (!config.headers || !config.headers['Authorization']) {
        console.log('GENERATING ACCESS TOKEN');
        try {
          const accessToken = await generateSRAccessToken(clientId, clientSecret);

          console.log('ACCESS TOKEN => ', accessToken);
          config.headers['Authorization'] = `Bearer ${accessToken}`;
          swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (err) {
          return Promise.reject(err);
        }
      }

      return config;
    },
    (err) => {
      console.log('Axios request interceptor error => ', err);
      return Promise.reject(err);
    }
  );

  swissReInstance.interceptors.response.use(
    (res) => {
      return res;
    },
    async (err) => {
      console.log('ERROR => ', err);
      const originalConfig = err.config;
      if (err.response) {
        if (err.response.status === 401 && !originalConfig._retry) {
          originalConfig._retry = true;
          let config = err.config;

          try {
            let accessToken = await generateSRAccessToken(clientId, clientSecret);
            console.log('REFRESHED TOKEN => ', accessToken);

            if (accessToken)
              swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            return swissReInstance(config);
          } catch (err) {
            return Promise.reject(err);
          }
        }
        if (err.response.status === 403 && !originalConfig._retry) {
          originalConfig._retry = true;
          let config = err.config;

          try {
            let accessToken = await generateSRAccessToken(clientId, clientSecret);
            console.log('REFRESHED TOKEN => ', accessToken);

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

function generateSRAccessToken(clientId: string, clientSecret: string) {
  return new Promise<string>(async (resolve, reject) => {
    // const clientId: string | undefined = await getSecret('SWISS_RE_CLIENT_ID');
    // const clientSecret: string | undefined = await getSecret('SWISS_RE_CLIENT_SECRET');
    // const authScope: string | undefined = process.env.SWISS_RE_AUTH_SCOPE;
    // const srAuthURL: string | undefined = process.env.SWISS_RE_ACCESS_TOKEN_URL;
    const authScope = 'https://AZ0-RNG-NONPROD-SyncRateServer.swissre.com/.default';
    const srAuthURL = 'https://login.microsoftonline.com/swissre.onmicrosoft.com/oauth2/v2.0/token';

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

    const { data } = await axios.post(srAuthURL, querystring.stringify(reqBody));

    resolve(data.access_token);
  });
}
