import axios from 'axios';

export const ePayInstance = axios.create({
  baseURL: `${import.meta.env.VITE_EPAY_BASE_URL}`,
  headers: {
    Authorization: `Api-Key  ${import.meta.env.VITE_EPAY_PUBLIC_KEY}`,
  },
});
