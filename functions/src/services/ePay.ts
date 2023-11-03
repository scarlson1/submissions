import axios from 'axios'; // { AxiosRequestConfig }
import { ePayBaseURL } from '../common/index.js';

export const getEPayInstance = (ePayCreds: string) => {
  const ePayInstance = axios.create({
    baseURL: ePayBaseURL.value(),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${ePayCreds}`,
    },
  });

  ePayInstance.interceptors.request.use(
    async (config: any) => {
      if (!config.headers) config.headers = {};

      return config;
    },
    (err) => {
      console.log('Axios request interceptor error => ', err);
      return Promise.reject(err);
    }
  );

  return ePayInstance;
};
