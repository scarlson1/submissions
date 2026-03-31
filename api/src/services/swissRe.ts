import axios, { AxiosRequestConfig } from 'axios';
import { generateSRAccessToken } from '../config';

// TODO: set up swiss re authentication as instance

export const swissReInstance = axios.create({
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
  async (config: AxiosRequestConfig) => {
    if (!config.headers) config.headers = {};
    if (!config.headers['Authorization']) {
      console.log('GENERATING ACCESS TOKEN');
      try {
        const start = new Date().getTime();
        const accessToken = await generateSRAccessToken();
        console.log('TOKEN GENERATION TIME: ', new Date().getTime() - start);

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
          const start = new Date().getTime();
          let accessToken = await generateSRAccessToken();
          console.log('TOKEN GENERATION TIME: ', new Date().getTime() - start);
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
          let accessToken = await generateSRAccessToken();
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
