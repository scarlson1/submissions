import axios from 'axios';

import type { Address } from '@idemand/common';
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
    },
  );

  return attomInstance;
};

export function getAttomProperty(
  apiKey: string,
  { addressLine1, addressLine2 = '', city, state, postal = '' }: Address,
) {
  const attomClient = getAttomInstance(apiKey);

  return attomClient
    .get<any>('/propertyapi/v1.0.0/property/basicprofile', {
      params: {
        address1: `${addressLine1} ${addressLine2}`.trim(),
        address2: `${city || ''}, ${state || ''} ${postal || ''}`.trim(),
      },
    })
    .then(({ data }) => {
      const profile =
        data?.property && data.property.length > 0 ? data.property[0] : null;

      return { data, profile };
    });
}
