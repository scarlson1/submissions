import axios from 'axios'; // { AxiosRequestConfig }

export const getEPayInstance = (ePayCreds: string) => {
  const ePayBaseUrl = process.env.EPAY_BASE_URL;

  if (!ePayBaseUrl) throw new Error('missing EPAY_BASE_URL env var');

  const ePayInstance = axios.create({
    baseURL: ePayBaseUrl,
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
