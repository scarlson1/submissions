import axios from 'axios';

import { submissionsApiBaseURL } from '../common/index.js';

export const getSubmissionsInstance = () => {
  const submissionsInstance = axios.create({
    baseURL: submissionsApiBaseURL.value(),
    headers: {
      Accept: 'application/json',
    },
  });

  // TODO: error handling
  submissionsInstance.interceptors.response.use(
    (res) => {
      return res;
    },
    async (err) => {
      console.log('ERROR => ', err);

      return Promise.reject(err);
    }
  );

  return submissionsInstance;
};
