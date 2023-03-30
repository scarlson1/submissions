import { useState, useCallback } from 'react';

import {
  fetchPropertyDetails,
  getPropertyDetailsAttom,
  GetPropertyDetailsAttomRequest,
} from 'modules/api';
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

    return data;
  }, []);

  return { fetchPropertyData, propertyDetails };
};

export const usePropertyDetailsAttom = () => {
  const [propertyDetails, setPropertyDetails] = useState<any>();

  const fetchPropertyData = useCallback(async (args: GetPropertyDetailsAttomRequest) => {
    const fetchDetails = getPropertyDetailsAttom(getFunctions());
    const { data } = await fetchDetails(args);

    setPropertyDetails({ ...data });

    return data;
  }, []);

  return { fetchPropertyData, propertyDetails };
};
