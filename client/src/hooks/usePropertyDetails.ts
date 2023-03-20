import { useState, useCallback } from 'react';

import { fetchPropertyDetails } from 'modules/api';
import { Coordinates } from 'common/types';
import { getFunctions } from 'firebase/functions';

export const usePropertyDetails = () => {
  const [propertyDetails, setPropertyDetails] = useState<any>();

  const fetchPropertyData = useCallback(async (args: Coordinates) => {
    // const fetchPropertyDetails = httpsCallable<any, any>(getFunctions(), 'getPropertyDetails');
    const fetchDetails = fetchPropertyDetails(getFunctions());
    const { data } = await fetchDetails(args);
    // const { data } = await fetchPropertyDetails(args);
    setPropertyDetails({ ...data });

    // TODO: validate / format data ? handled server side ??

    return data;
  }, []);

  return { fetchPropertyData, propertyDetails };
};

// export const usePropertyDetails = () => {
//   const [propertyDetails, setPropertyDetails] = useState<any>();

//   const fetchPropertyData = useCallback(async (args: Coordinates) => {
//     const { data } = await fetchPropertyDetails(args);
//     setPropertyDetails({ ...data });

//     // TODO: validate / format data ? handled server side ??

//     return data;
//   }, []);

//   return { fetchPropertyData, propertyDetails };
// };
