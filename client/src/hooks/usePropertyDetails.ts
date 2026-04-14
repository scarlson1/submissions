import { round, sum } from 'lodash';
import { useCallback, useState } from 'react';
import { useFunctions } from 'reactfire';

import type {
  Basement,
  Coords,
  InitRatingValues,
  Nullable,
} from '@idemand/common';
import { getPropertyDetailsAttom, GetPropertyDetailsAttomRequest } from 'api';
import { ElevationResult, LimitKeys, RatingPropertyData } from 'common';
import { logDev } from 'modules/utils';
import { usePromptRCV } from './usePromptRCV';

// @ts-ignore
let MAX_A = parseInt(import.meta.env.VITE_FLOOD_MAX_LIMIT_A || '1000000'); // @ts-ignore
let MIN_A = parseInt(import.meta.env.VITE_FLOOD_MIN_LIMIT_A || '100000');

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

  const sumCoverage = sum(Object.values(defaults));
  const deductible = round(sumCoverage * 0.01, -3);
  const maxDeductible = round(sumCoverage * 0.2, -3);

  return { ...calcDefaults, deductible, maxDeductible };
}

// TODO: match response from cloud function to mirror how data is stored below

export const DEFAULT_INIT_VALUES = {
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

// TODO: manage state in backend instead of storing in hook (property data, elevation, rcv source, etc.)

export const usePropertyDetailsAttom = (props?: UsePropertyDetailsProps) => {
  const functions = useFunctions();
  const [propertyDetails, setPropertyDetails] = useState<
    Nullable<RatingPropertyData>
  >({
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
    elevation: null,
  });
  const [elevationData, setElevationData] = useState<ElevationResult | null>(
    null,
  );
  const [rcvSourceUser, setRcvSourceUser] = useState<null | number>(null);
  const [initRatingValues, setInitRatingValues] =
    useState<InitRatingValues>(DEFAULT_INIT_VALUES);
  const [propertyDataDocId, setPropertyDataDocId] = useState<string | null>(
    null,
  );
  const promptRCV = usePromptRCV();

  const fetchPropertyData = useCallback(
    async (
      args: GetPropertyDetailsAttomRequest,
    ): Promise<
      InitRatingValues & {
        ratingPropertyData: Partial<RatingPropertyData>;
        coordinates: Nullable<Coords>;
      }
    > => {
      const fetchDetails = getPropertyDetailsAttom(functions);
      const { data } = await fetchDetails(args);

      logDev(data);

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
        elevation: data.elevation || null,
      };

      setPropertyDataDocId(data.attomDocId || null);
      setElevationData(data?.elevationData || null);

      if (!data.replacementCost && props?.promptForValuation) {
        const estRCV = await promptRCV();

        if (estRCV) {
          setRcvSourceUser(estRCV);
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
              basement: data.basement || ('' as Basement),
            },
            coordinates: data.coordinates,
          };
        } else {
          setRcvSourceUser(null);
          setPropertyDetails(newPropDetails);
          setInitRatingValues(DEFAULT_INIT_VALUES);

          return {
            ...DEFAULT_INIT_VALUES,
            ratingPropertyData: {
              // @ts-ignore
              numStories: data.numStories || '',
              basement: data.basement || ('' as Basement),
            },
            coordinates: data.coordinates,
          };
        }
      } else {
        setRcvSourceUser(null);
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
            basement: data.basement || ('' as Basement),
          },
        };
      }
    },
    [functions, promptRCV, props],
  );

  return {
    fetchPropertyData,
    rcvSourceUser,
    initRatingValues,
    propertyDataDocId,
    propertyDetails,
    elevationData,
  };
};
