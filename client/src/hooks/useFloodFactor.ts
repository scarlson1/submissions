import { useCallback } from 'react';

import { Address } from 'common';
import { useAsyncToast } from './useAsyncToast';
import { useFunctions } from 'reactfire';
import { getRiskFactorId } from 'modules/api';

function firstStreetFormat(str: string) {
  return str.toLowerCase().replaceAll(' ', '-');
}

export const useFloodFactor = () => {
  const functions = useFunctions();
  const toast = useAsyncToast({ position: 'top-right' });

  const openFloodFactor = useCallback(
    async (address: Address) => {
      const { addressLine1, city, state, postal } = address;
      let fsid;

      try {
        toast.loading('fetching location ID...');

        const { data } = await getRiskFactorId(functions, {
          addressLine1,
          city,
          state,
        });

        console.log('GET ID RES: ', data);
        fsid = data?.fsid;
      } catch (err) {
        console.log('ERROR: ', err);
      }

      if (fsid) {
        let floodStreetUrl = `https://riskfactor.com/property/${firstStreetFormat(
          addressLine1
        )}-${firstStreetFormat(city)}-${firstStreetFormat(state)}-${firstStreetFormat(
          postal
        )}/${fsid}_fsid/flood`;

        toast.success(`opening in new tab (FSID: ${fsid})`);
        window.open(floodStreetUrl, '_blank');
      } else {
        toast.error('Unable to get location ID');
      }
    },
    [functions, toast]
  );

  return openFloodFactor;
};
