import { useState, useCallback } from 'react';
import { round } from 'lodash';

import {
  fetchPropertyDetails,
  getPropertyDetailsAttom,
  GetPropertyDetailsAttomRequest,
} from 'modules/api';
import { Coordinates, LimitKeys } from 'common/types';
import { getFunctions } from 'firebase/functions';
import { usePromptRCV } from './usePromptRCV';
import { calcSum } from 'modules/utils';

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

let MAX_A = parseInt(process.env.REACT_APP_FLOOD_MAX_LIMIT_A || '1000000');
let MIN_A = parseInt(process.env.REACT_APP_FLOOD_MIN_LIMIT_A || '100000');

type TDefaultLimitPct = { [key in LimitKeys]: number };

let defaultLimitPercents: TDefaultLimitPct = {
  limitA: 1,
  limitB: 0.05,
  limitC: 0.25,
  limitD: 0.1,
};

function getDefaultsFromRCV(rcv: number) {
  let defaults = {
    initLimitA: 250000,
    initLimitB: 25000,
    initLimitC: 63000,
    initLimitD: 38000,
    initDeductible: 4000,
    maxDeductible: 200000,
  };
  if (!rcv || rcv < 100000) return defaults;

  let limitARef = round(Math.min(Math.max(rcv, MIN_A), MAX_A), -3);

  const calcDefaults = {
    initLimitA: limitARef,
    initLimitB: round(limitARef * defaultLimitPercents['limitB'], -3),
    initLimitC: round(limitARef * defaultLimitPercents['limitC'], -3),
    initLimitD: round(limitARef * defaultLimitPercents['limitD'], -3),
  };

  const sumCoverage = calcSum(Object.values(defaults));
  const initDeductible = round(sumCoverage * 0.01, -3);
  const maxDeductible = round(sumCoverage * 0.2, -3);

  return { ...calcDefaults, initDeductible, maxDeductible };
}

interface UsePropertyDetailsProps {
  promptForValuation: boolean;
}

export const usePropertyDetailsAttom = (props?: UsePropertyDetailsProps) => {
  const [propertyDetails, setPropertyDetails] = useState<any>();
  const promptRCV = usePromptRCV();

  const fetchPropertyData = useCallback(
    async (args: GetPropertyDetailsAttomRequest) => {
      const fetchDetails = getPropertyDetailsAttom(getFunctions());
      const { data } = await fetchDetails(args);

      if (
        (!data.replacementCost && props?.promptForValuation) ||
        process.env.REACT_APP_FB_PROJECT_ID === 'idemand-submissions-dev'
      ) {
        // TODO: prompt for value
        const estRCV = await promptRCV();
        console.log('EST RCV RES: ', estRCV);

        if (estRCV) {
          const newDefaults = getDefaultsFromRCV(estRCV);
          console.log('NEW VALUES: ', newDefaults);

          const updatedData = {
            ...data,
            ...newDefaults,
            replacementCost: estRCV || null,
            rcvSouceUser: true,
          };

          setPropertyDetails(updatedData);

          return updatedData;
        } else {
          setPropertyDetails({ ...data, rcvSouceUser: false });
          return data;
        }
      } else {
        setPropertyDetails({ ...data, rcvSouceUser: false });
        return data;
      }
    },
    [promptRCV, props]
  );

  return { fetchPropertyData, propertyDetails };
};
