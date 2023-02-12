import axios, { AxiosRequestConfig } from 'axios';

import { GenerateTokenArgs, getAccessToken } from '../config/spatialKeyToken';

// const spatialKeyTokenURL = `https://idemand.spatialkey.com/SpatialKeyFramework/api/v2/oauth.json?grant_type=${param1}&assertion=${param2}`

export const getSpatialKeyInstance = (args: GenerateTokenArgs) => {
  const instance = axios.create({
    baseURL: 'https://idemand.spatialkey.com',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  instance.interceptors.request.use(
    async (config: AxiosRequestConfig) => {
      if (!config.headers) config.headers = {};
      // @ts-ignore
      if (!config.headers.common || !config.headers.common['x-sktoken']) {
        console.log('GENERATING ACCESS TOKEN');
        try {
          const accessToken = await getAccessToken(args);
          // eslint-disable-next-line
          // @ts-ignore
          config.headers['x-sktoken'] = accessToken;
          instance.defaults.headers.common['x-sktoken'] = accessToken;
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

  instance.interceptors.response.use(
    (res) => {
      return res;
    },
    async (err) => {
      console.log('ERROR => ', err.response?.data);
      const originalConfig = err.config;
      if (err.response) {
        if (err.response.status === 401 && !originalConfig._retry) {
          originalConfig._retry = true;
          const config = err.config;
          console.log('401 ERROR... GENERATING NEW ACCESS TOKEN');

          try {
            const accessToken = await getAccessToken(args);
            // console.log('REFRESHED TOKEN => ', accessToken);

            config.headers['x-sktoken'] = accessToken;
            instance.defaults.headers.common['x-sktoken'] = accessToken;

            return instance(config);
          } catch (err) {
            return Promise.reject(err);
          }
        }
        if (err.response.status === 403 && !originalConfig._retry) {
          originalConfig._retry = true;
          const config = err.config;
          console.log('403 ERROR... GENERATING NEW ACCESS TOKEN');

          try {
            const accessToken = await getAccessToken(args);
            // console.log('REFRESHED TOKEN => ', accessToken);

            config.headers['x-sktoken'] = accessToken;
            instance.defaults.headers.common['x-sktoken'] = accessToken;

            return instance(config);
          } catch (err) {
            return Promise.reject(err);
          }
        }
      }

      return Promise.reject(err);
    }
  );

  return instance;
};
