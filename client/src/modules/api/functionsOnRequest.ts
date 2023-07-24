import axios from 'axios';
import { getAuth } from 'firebase/auth';

export const functionsInstance = axios.create({
  baseURL: process.env.REACT_APP_FUNCTIONS_BASE_URL,
});
functionsInstance.defaults.baseURL = process.env.REACT_APP_FUNCTIONS_BASE_URL;

functionsInstance.interceptors.request.use(
  async (config: any) => {
    const auth = getAuth();
    const token = await auth.currentUser?.getIdToken(true);
    // console.log('REFRESHED ID TOKEN: ', token);
    if (!config.headers) config.headers = {};

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    } else {
      axios.defaults.headers.common['Authorization'] = false;
    }
    return config;
  },
  (err) => {
    return Promise.reject(err);
  }
);

functionsInstance.interceptors.response.use(
  async (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data

    return response;
  },
  (err) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // TODO: match with quote instance
    // TODO: type Error ??
    console.log('ERROR: ', err);
    let { errors } = err.response.data;
    if (
      errors &&
      Array.isArray(errors) &&
      errors.length > 0 &&
      errors[0].hasOwnProperty('message')
    ) {
      err.hasErrorMessages = true;
      err.errorMessages = errors;
      console.log('Error messages: ', errors);
    } else {
      err.hasErrorMessages = false;
      err.errorMessages = [];
    }
    return Promise.reject(err);
  }
);
