import axios from 'axios';

// PUBLIC API

export const protosure = axios.create({
  baseURL: `${process.env.PROTOSURE_BASE_URL_DEV}/public-api/${process.env.PROTOSURE_TENANT_ID_V2}`, // ${process.env.PROTOSURE_TENANT_ID}
  headers: {
    'Content-Type': 'application/json',
  },
});
// 'Access-Control-Allow-Origin': '*',
