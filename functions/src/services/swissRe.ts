import axios from 'axios'; // { AxiosRequestConfig }
import { error } from 'firebase-functions/logger';
import querystring from 'querystring';
import {
  getReportErrorFn,
  swissReAccessTokenURL,
  swissReAuthScope,
  swissReProductCode,
  swissReToolCode,
} from '../common/index.js';

// TODO: separate out interceptors for type support
// https://jaello-world.hashnode.dev/axios-interceptors-with-typescript

// TODO: use redis to store api token ??
// https://www.thedutchlab.com/insights/using-axios-interceptors-for-refreshing-your-api-token

// TODO: any benefit to using a class instead of getInstance ??

const reportErr = getReportErrorFn('swissRe');

export const getSwissReInstance = (
  clientId: string,
  clientSecret: string,
  subscriptionKey: string
) => {
  const swissReInstance = axios.create({
    baseURL: process.env.SWISS_RE_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'SR-RNG-ProductCode': swissReProductCode.value(),
      'SR-RNG-LossModelToolCode': swissReToolCode.value(),
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
  });

  swissReInstance.interceptors.request.use(
    async (config: any) => {
      if (!config.headers) config.headers = {}; // TODO: check expiration time
      console.log('CONFIG HEADERS: ', config.headers); // TODO: delete (dont log key)

      // TODO: DELETE - FOR DEBUGGING KEY REFRESH
      if (!config._retry && config.headers['Authorization']) {
        delete config.headers['Authorization'];
      }

      if (!config.headers || !config.headers['Authorization']) {
        try {
          console.log('REQUEST INTERCEPTOR - FETCHING TOKEN...');
          const accessToken = await generateSRAccessToken(clientId, clientSecret);

          // TODO: DELETE - FOR DEBUGGING KEY REFRESH
          // if (!config.retry) {
          //   console.log('SETTING AUTHORIZATION TOKEN');
          //   config.headers['Authorization'] = `Bearer ${accessToken}`;
          //   swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          // }
          // TODO: uncomment and delete above
          config.headers['Authorization'] = `Bearer ${accessToken}`;
          swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        } catch (err) {
          return Promise.reject(err);
        }
      }

      return config;
    },
    (err) => {
      error('Axios request interceptor error => ', err.response);
      return Promise.reject(err);
    }
  );

  swissReInstance.interceptors.response.use(
    (res) => {
      return res;
    },
    async function (err: any) {
      // error('SR REQUEST ERROR => ', { ...err });
      reportErr(`SwissRe request error`, {}, err);

      const originalConfig = err.config;
      if (err.response) {
        if (err.response.status === 401 && !originalConfig._retry) {
          console.log('401 ERROR... GENERATING NEW ACCESS TOKEN');
          originalConfig._retry = true;

          try {
            let accessToken = await generateSRAccessToken(clientId, clientSecret);

            if (accessToken)
              swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            // Does new token also need to be set on config (originalConfig.headers.Authorization = token) ??
            if (accessToken) originalConfig.headers.Authorization = `Bearer ${accessToken}`;

            return swissReInstance(originalConfig);
          } catch (err) {
            return Promise.reject(err);
          }
        }
        if (err.response.status === 403 && !originalConfig._retry) {
          console.log('403 ERROR... GENERATING NEW ACCESS TOKEN');
          originalConfig._retry = true;
          // let config = err.config;

          try {
            let accessToken = await generateSRAccessToken(clientId, clientSecret);

            if (accessToken)
              swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            return swissReInstance(originalConfig);
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

export function generateSRAccessToken(clientId: string, clientSecret: string) {
  return new Promise<string>(async (resolve, reject) => {
    const authScope = swissReAuthScope.value();
    const srAuthURL = swissReAccessTokenURL.value();

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

    console.log('GENERATING SR ACCESS TOKEN...');
    const { data } = await axios.post(srAuthURL, querystring.stringify(reqBody));
    console.log('GENERATED NEW SR ACCESS TOKEN');

    resolve(data.access_token);
  });
}

// const onRequest = (
//   config: AxiosRequestConfig,
//   clientId: string,
//   clientSecret: string
// ): AxiosRequestConfig => {
//   console.info(`[request] [${JSON.stringify(config)}]`);
//   return config;
// };

// const onRequestError = (error: AxiosError): Promise<AxiosError> => {
//   console.error(`[request error] [${JSON.stringify(error)}]`);
//   return Promise.reject(error);
// };

// const onResponse = (response: AxiosResponse): AxiosResponse => {
//   console.info(`[response] [${JSON.stringify(response)}]`);
//   return response;
// };

// const onResponseError = async (
//   err: AxiosError,
//   swissReInstance: AxiosInstance,
//   clientId: string,
//   clientSecret: string,
// ): Promise<AxiosError> => {
//   console.error(`[response error] [${JSON.stringify(err)}]`);

//   if (axios.isAxiosError(err)) {
//     const { message } = err;
//     // const { method, url } = err.config as AxiosRequestConfig;
//     const { statusText, status } = err.response as AxiosResponse ?? {};
//     const originalConfig = err.config || { headers: { Authorization: '' } } // as AxiosRequestConfig;

//     error(`Swiss Re. error: ${message}`, {statusText, status})

//     switch (status) {
//       case 401: {
//         // "Login required"
//         // @ts-ignore
//         if (!originalConfig._retry) {
//           try {
//             let accessToken = await generateSRAccessToken(clientId, clientSecret);

//             if (accessToken){
//               swissReInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

//               // Does new token also need to be set on config (originalConfig.headers.Authorization = token) ??
//               originalConfig.headers.Authorization = `Bearer ${accessToken}`;
//             }

//             return swissReInstance(originalConfig);
//           } catch (err) {
//             return Promise.reject(err);
//           }

//         } else {
//           return Promise.reject(err);
//         }
//       }
//       case 403: {
//         // "Permission denied"
//         break;
//       }
//       case 404: {
//         // "Invalid request"
//         break;
//       }
//       case 500: {
//         // "Server error"
//         break;
//       }
//       default: {
//         // "Unknown error occurred"
//         break;
//       }
//     }
//   }

//   return Promise.reject(error);
// };

// // const onRequest = (config: AxiosRequestConfig): AxiosRequestConfig => {
// //   console.info(`[request] [${JSON.stringify(config)}]`);
// //   return config;
// // };

// // const onRequestError = (error: AxiosError): Promise<AxiosError> => {
// //   console.error(`[request error] [${JSON.stringify(error)}]`);
// //   return Promise.reject(error);
// // };

// // const onResponse = (response: AxiosResponse): AxiosResponse => {
// //   console.info(`[response] [${JSON.stringify(response)}]`);
// //   return response;
// // };

// // const onResponseError = (error: AxiosError): Promise<AxiosError> => {
// //   console.error(`[response error] [${JSON.stringify(error)}]`);
// //   return Promise.reject(error);
// // };

// // export function setupInterceptorsTo(axiosInstance: AxiosInstance): AxiosInstance {
// //   axiosInstance.interceptors.request.use(onRequest, onRequestError);
// //   axiosInstance.interceptors.response.use(onResponse, onResponseError);
// //   return axiosInstance;
// // }

// // USAGE:
// // import { setupInterceptorsTo } from './Interceptors';
// // import axios from 'axios';
// // setupInterceptorsTo(axios);
