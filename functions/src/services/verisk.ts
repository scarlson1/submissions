import axios from 'axios';

// interface GetVeriskInstanceProps {
//   groupId: string;
//   password: string;
//   userData: string;
// }

// export const getVeriskInstance = ({ groupId, password, userData }: GetVeriskInstanceProps) => {
// if (!(groupId && password && userData)) throw new Error('Missing verisk credentials');

export const getVeriskInstance = () => {
  if (!process.env.VERISK_BASE_URL) throw new Error('Missing verisk base url env var');

  const veriskInstance = axios.create({
    baseURL: process.env.VERISK_BASE_URL,
    // headers: {
    //   // Accept: 'application/json',
    //   apikey: apiKey,
    // },
  });

  veriskInstance.interceptors.response.use(
    (res) => {
      return res;
    },
    async (err) => {
      console.log('ERROR => ', err);

      return Promise.reject(err);
    }
  );

  return veriskInstance;
};
