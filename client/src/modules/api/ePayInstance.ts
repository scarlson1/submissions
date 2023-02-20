import axios from 'axios';

export const ePayInstance = axios.create({
  baseURL: `${process.env.REACT_APP_EPAY_BASE_URL}`,
  headers: {
    Authorization: `Api-Key  ${process.env.REACT_APP_EPAY_PUBLIC_KEY}`,
  },
});
