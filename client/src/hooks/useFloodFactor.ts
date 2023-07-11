import { useCallback } from 'react';
import { useFunctions } from 'reactfire';

import { Address, Optional } from 'common';
import { useAsyncToast } from './useAsyncToast';
import { getRiskFactorId } from 'modules/api';
import { popUpWasBlocked } from 'modules/utils';

function firstStreetFormat(str: string) {
  return str.toLowerCase().replaceAll(' ', '-');
}

export const useFloodFactor = (onError?: (msg: string) => void) => {
  const functions = useFunctions();
  const toast = useAsyncToast({ position: 'top-right' });

  const openFloodFactor = useCallback(
    async (address: Optional<Address>) => {
      const addressLine1 = address?.addressLine1;
      const city = address?.city;
      const state = address?.state;
      const postal = address?.postal;
      if (!(addressLine1 && city && state && postal)) {
        if (onError) onError('missing address');
        return;
      }

      let fsid;

      try {
        toast.loading('fetching location ID...');
        const { data } = await getRiskFactorId(functions, {
          addressLine1,
          city,
          state,
        });

        fsid = data?.fsid;
      } catch (err: any) {
        console.log('ERROR: ', err);
        let msg = `Error fetching fsid`;
        if (err.message) msg = err.message;
        toast.dismiss();

        if (onError) onError(msg);
        return;
      }

      if (fsid) {
        let floodStreetUrl = `https://riskfactor.com/property/${firstStreetFormat(
          addressLine1
        )}-${firstStreetFormat(city)}-${firstStreetFormat(state)}-${firstStreetFormat(
          postal
        )}/${fsid}_fsid/flood`;

        toast.success(`opening in new tab (FSID: ${fsid})`);
        const w = window.open(floodStreetUrl, '_blank');

        if (popUpWasBlocked(w)) toast.error('Please allow the new window to view risk factor');
      } else {
        toast.error('Unable to get location ID');
      }
    },
    [functions, toast, onError]
  );

  return openFloodFactor;
};
