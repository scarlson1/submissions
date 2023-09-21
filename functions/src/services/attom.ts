import axios from 'axios';

import { attomBaseURL } from '../common/index.js';

export const getAttomInstance = (apiKey?: string) => {
  if (!apiKey) throw new Error('Missing Attom api key');
  const attomInstance = axios.create({
    baseURL: attomBaseURL.value(),
    headers: {
      Accept: 'application/json',
      apikey: apiKey,
    },
  });

  attomInstance.interceptors.response.use(
    (res) => {
      return res;
    },
    async (err) => {
      console.log('ERROR => ', err);

      return Promise.reject(err);
    }
  );

  return attomInstance;
};
