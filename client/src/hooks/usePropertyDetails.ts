import { useState, useCallback } from 'react';

import { fetchPropertyDetails } from 'modules/api';
import { Coordinates } from 'common/types';

export const usePropertyDetails = () => {
  const [propertyDetails, setPropertyDetails] = useState<any>();

  const fetchPropertyData = useCallback(async (args: Coordinates) => {
    const { data } = await fetchPropertyDetails(args);
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
