import axios, { AxiosRequestConfig } from 'axios';
import { getAccessToken } from '../config/spatialKeyAuth.js';

// const spatialKeyTokenURL = `https://idemand.spatialkey.com/SpatialKeyFramework/api/v2/oauth.json?grant_type=${param1}&assertion=${param2}`

export const spatialKeyInstance = axios.create({
  baseURL: 'https://idemand.spatialkey.com',
  headers: {
    'Content-Type': 'application/json',
  },
});

spatialKeyInstance.interceptors.request.use(
  // @ts-ignore
  async (config: AxiosRequestConfig) => {
    if (!config.headers) config.headers = {};
    if (!config.headers.common || !config.headers.common['x-sktoken']) {
      console.log('GENERATING ACCESS TOKEN');
      try {
        const start = new Date().getTime();
        let accessToken = await getAccessToken();
        console.log('TOKEN GENERATION TIME: ', new Date().getTime() - start);

        console.log('ACCESS TOKEN => ', accessToken);
        config.headers['x-sktoken'] = accessToken;
        spatialKeyInstance.defaults.headers.common['x-sktoken'] = accessToken;
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return config;
  },
  (err) => {
    console.log('Axios request interceptor error => ', err);
    return Promise.reject(err);
  },
);

spatialKeyInstance.interceptors.response.use(
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
          let accessToken = await getAccessToken();
          console.log('REFRESHED TOKEN => ', accessToken);

          config.headers['x-sktoken'] = accessToken;
          spatialKeyInstance.defaults.headers.common['x-sktoken'] = accessToken;

          return spatialKeyInstance(config);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      if (err.response.status === 403 && !originalConfig._retry) {
        originalConfig._retry = true;
        let config = err.config;

        try {
          let accessToken = await getAccessToken();
          console.log('REFRESHED TOKEN => ', accessToken);

          config.headers['x-sktoken'] = accessToken;
          spatialKeyInstance.defaults.headers.common['x-sktoken'] = accessToken;

          return spatialKeyInstance(config);
        } catch (err) {
          return Promise.reject(err);
        }
      }
    }

    return Promise.reject(err);
  },
);
