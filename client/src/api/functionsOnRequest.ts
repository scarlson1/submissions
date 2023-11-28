import axios from 'axios';
import { EmailAuthProvider, getAuth, reauthenticateWithCredential } from 'firebase/auth';

export const functionsInstance = axios.create({
  baseURL: import.meta.env.VITE_FUNCTIONS_BASE_URL,
});
functionsInstance.defaults.baseURL = import.meta.env.VITE_FUNCTIONS_BASE_URL;

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
    return response;
  },
  async (err) => {
    // Any status code that falls outside the range of 2xx cause this function to trigger

    // TODO: match with quote instance error handling
    console.log('ERROR: ', err);
    // const data = err.response?.data;

    // BUG: parsing error --> causes failure before 403 token refresh can run
    // const isJsonBlob = (data: any) => data instanceof Blob && data.type === 'application/json';

    // const responseData = isJsonBlob(data) ? await data?.text() : data || {};

    // const responseJson = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;

    // let errors = responseJson?.errors;
    const data = err.response?.data;
    let errors = data?.errors;

    const originalRequest = err.config;
    // const tokenRevoked = isRevokedError(errors);
    console.log('not retry already: ', !originalRequest._retry);

    // tokenRevoked &&
    if (err.response.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('attempting token refresh...');
        const userCred = await onIdTokenRevocation();
        const token = await userCred.user.getIdToken();

        if (token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

          return functionsInstance(originalRequest);
        }
      } catch (err: any) {
        console.log('revoked token reauth error: ', err);
      }
    }

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

// function isRevokedError(errors?: any[]) {
//   if (!errors || !Array.isArray(errors)) return false;
//   return errors.some((e) => e.hasOwnProperty('code') && e.code === 'auth/id-token-revoked');
// }

// docs: https://firebase.google.com/docs/auth/admin/manage-sessions#detect_id_token_revocation_in_the_sdk
async function onIdTokenRevocation() {
  // For an email/password user. Prompt the user for the password again.
  let password = prompt('Auth session expired. Please provide your password for reauthentication');
  if (!password) throw new Error('password not provided');

  const auth = getAuth();
  const user = auth?.currentUser;
  if (!user || !user?.email) throw new Error('not signed in or missing email');

  let credential = EmailAuthProvider.credential(user.email, password);

  return await reauthenticateWithCredential(auth.currentUser, credential);
}
