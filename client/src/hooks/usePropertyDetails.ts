import { useState, useCallback } from 'react';
import { useFunctions } from 'reactfire';
import { round } from 'lodash';

import {
  fetchPropertyDetails,
  getPropertyDetailsAttom,
  GetPropertyDetailsAttomRequest,
} from 'modules/api';
import { Coordinates, LimitKeys, Limits, Nullable, RatingPropertyData } from 'common/types';

import { usePromptRCV } from './usePromptRCV';
import { calcSum } from 'modules/utils';

export const usePropertyDetails = () => {
  const functions = useFunctions();
  const [propertyDetails, setPropertyDetails] = useState<any>();

  const fetchPropertyData = useCallback(
    async (args: Coordinates) => {
      // const fetchPropertyDetails = httpsCallable<any, any>(getFunctions(), 'getPropertyDetails');
      const fetchDetails = fetchPropertyDetails(functions);
      const { data } = await fetchDetails(args);
      // const { data } = await fetchPropertyDetails(args);

      setPropertyDetails({ ...data });

      return data;
    },
    [functions]
  );

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
    limitA: 250000,
    limitB: 25000,
    limitC: 63000,
    limitD: 38000,
    deductible: 4000,
    maxDeductible: 200000,
  };
  if (!rcv || rcv < 100000) return defaults;

  let limitARef = round(Math.min(Math.max(rcv, MIN_A), MAX_A), -3);

  const calcDefaults = {
    limitA: limitARef,
    limitB: round(limitARef * defaultLimitPercents['limitB'], -3),
    limitC: round(limitARef * defaultLimitPercents['limitC'], -3),
    limitD: round(limitARef * defaultLimitPercents['limitD'], -3),
  };

  const sumCoverage = calcSum(Object.values(defaults));
  const deductible = round(sumCoverage * 0.01, -3);
  const maxDeductible = round(sumCoverage * 0.2, -3);

  return { ...calcDefaults, deductible, maxDeductible };
}

export interface InitRatingValues extends Limits {
  deductible: number;
  maxDeductible: number;
}

// TODO: match response from cloud function to mirror how data is stored below

const DEFAULT_INIT_VALUES = {
  deductible: 4000,
  limitA: 250000,
  limitB: 25000,
  limitC: 63000,
  limitD: 38000,
  maxDeductible: 100000,
};

interface UsePropertyDetailsProps {
  promptForValuation: boolean;
}

export const usePropertyDetailsAttom = (props?: UsePropertyDetailsProps) => {
  const functions = useFunctions();
  const [propertyDetails, setPropertyDetails] = useState<Nullable<RatingPropertyData>>({
    CBRSDesignation: null,
    basement: null,
    distToCoastFeet: null,
    floodZone: null,
    numStories: null,
    propertyCode: null,
    replacementCost: null,
    sqFootage: null,
    yearBuilt: null,
    FFH: null,
  });
  const [rcvSourceUser, setRcvSourceUser] = useState<boolean>(false);
  const [initRatingValues, setInitRatingValues] = useState<InitRatingValues>(DEFAULT_INIT_VALUES);
  const [propertyDataDocId, setPropertyDataDocId] = useState<string | null>(null);
  const promptRCV = usePromptRCV();

  const fetchPropertyData = useCallback(
    async (
      args: GetPropertyDetailsAttomRequest
    ): Promise<InitRatingValues & { ratingPropertyData: Partial<RatingPropertyData> }> => {
      const fetchDetails = getPropertyDetailsAttom(functions);
      const { data } = await fetchDetails(args);

      let newPropDetails = {
        CBRSDesignation: data.CBRSDesignation || null,
        basement: data.basement || null,
        distToCoastFeet: data.distToCoastFeet || null,
        floodZone: data.floodZone || null,
        numStories: data.numStories || null,
        propertyCode: data.propertyCode || null,
        replacementCost: data.replacementCost || null,
        sqFootage: data.sqFootage || null,
        yearBuilt: data.yearBuilt || null,
        FFH: data.FFH || null,
      };

      setPropertyDataDocId(data.attomDocId || null);

      if (!data.replacementCost && props?.promptForValuation) {
        const estRCV = await promptRCV();

        if (estRCV) {
          setRcvSourceUser(true);
          const newDefaults = getDefaultsFromRCV(estRCV);

          setInitRatingValues({
            ...newDefaults,
          });
          setPropertyDetails({ ...newPropDetails, replacementCost: estRCV });

          return {
            ...newDefaults,
            ratingPropertyData: {
              // @ts-ignore
              numStories: data.numStories || '',
              basement: data.basement || '',
            },
          };
        } else {
          setRcvSourceUser(false);
          setPropertyDetails(newPropDetails);
          setInitRatingValues(DEFAULT_INIT_VALUES);

          return {
            ...DEFAULT_INIT_VALUES,
            ratingPropertyData: {
              // @ts-ignore
              numStories: data.numStories || '',
              basement: data.basement || '',
            },
          };
        }
      } else {
        setRcvSourceUser(false);
        setPropertyDetails(newPropDetails);
        const initVals = {
          deductible: data.initDeductible,
          limitA: data.initLimitA,
          limitB: data.initLimitB,
          limitC: data.initLimitC,
          limitD: data.initLimitD,
          maxDeductible: data.maxDeductible,
        };
        setInitRatingValues(initVals);

        return {
          ...initVals,
          ratingPropertyData: {
            // @ts-ignore
            numStories: data.numStories || '',
            basement: data.basement || '',
          },
        };
      }
    },
    [functions, promptRCV, props]
  );

  return { fetchPropertyData, rcvSourceUser, initRatingValues, propertyDataDocId, propertyDetails };
};
