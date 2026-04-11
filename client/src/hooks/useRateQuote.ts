import { useCallback, useState } from 'react';
import { useFunctions } from 'reactfire';
import invariant from 'tiny-invariant';

import type { Optional } from '@idemand/common';
import { getAnnualPremium } from 'api';
import { GetAnnualPremiumRequest, RatingInputs } from 'api/getAnnualPremium';
import { TCommSource } from 'common';
import { QuoteValues } from 'elements/forms';
import { validateCommonInputs } from './useCalcPremium';

export interface RatingInputsWithComm extends RatingInputs {
  agentId: string | null;
  orgId: string | null;
  commSource: TCommSource;
}
export interface RatingInputsWithAAL extends RatingInputsWithComm {
  inlandAAL: number | null;
  surgeAAL: number | null;
  tsunamiAAL: number | null;
}

export function extractRatingInputsFromValues(
  values: QuoteValues,
): RatingInputsWithComm {
  const {
    coordinates,
    limits,
    deductible,
    address,
    commSource,
    ratingPropertyData,
    agent,
    agency,
  } = values;

  // let subproducerCommission =
  //   typeof values.subproducerCommission === 'string'
  //     ? parseFloat(values.subproducerCommission)
  //     : values.subproducerCommission;
  let numStories = ratingPropertyData.numStories;

  if (numStories && typeof numStories === 'string') {
    numStories = parseInt(numStories);
  }

  return {
    latitude: coordinates?.latitude as number,
    longitude: coordinates?.longitude as number,
    replacementCost: ratingPropertyData?.replacementCost as number,
    ...limits,
    deductible,
    numStories: numStories || 1,
    state: address?.state,
    priorLossCount: ratingPropertyData?.priorLossCount || '',
    floodZone: ratingPropertyData?.floodZone, // || undefined,
    basement: ratingPropertyData?.basement?.toLowerCase(), // || undefined,
    // commissionPct: subproducerCommission || 0.15,
    commSource,
    agentId: agent?.userId,
    orgId: agency?.orgId,
  };
}

export function getValidRatingInputs(values: QuoteValues) {
  const commValidated = validateCommonInputs(values);
  const { coordinates } = commValidated;

  invariant(
    coordinates?.latitude && coordinates?.longitude,
    'coordinates required',
  );

  return extractRatingInputsFromValues(commValidated);
}

export const useRateQuote = (
  submissionId: string | null,
  onSuccess?: (
    premium: number,
    ratingInputs: RatingInputsWithAAL,
    ratingDocId?: Optional<string>,
  ) => void,
  onError?: (msg: string) => void,
  // initialRatingSnap?: Optional<RatingInputs>
) => {
  const functions = useFunctions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rerate = useCallback(
    async (values: QuoteValues) => {
      let ratingInputs;
      try {
        ratingInputs = getValidRatingInputs(values);
      } catch (err: any) {
        let msg = `missing required values`;
        if (err?.message) msg = err.message.replace('Invariant failed: ', '');
        if (onError) onError(msg);
        return;
      }

      setError(null);
      setLoading(true);

      try {
        const reformatRatingInputs: GetAnnualPremiumRequest = {
          coordinates: {
            latitude: ratingInputs.latitude,
            longitude: ratingInputs.longitude,
          },
          replacementCost: ratingInputs.replacementCost,
          limits: {
            limitA: ratingInputs.limitA,
            limitB: ratingInputs.limitB,
            limitC: ratingInputs.limitC,
            limitD: ratingInputs.limitD,
          },
          deductible: ratingInputs.deductible,
          numStories: ratingInputs.numStories,
          priorLossCount: ratingInputs.priorLossCount,
          state: ratingInputs.state,
          floodZone: ratingInputs.floodZone,
          basement: ratingInputs.basement,
          // commissionPct: ratingInputs.commissionPct,
          commSource: ratingInputs.commSource,
          agentId: ratingInputs.agentId,
          orgId: ratingInputs.orgId,
        };
        const { data } = await getAnnualPremium(functions, {
          ...reformatRatingInputs,
          submissionId,
        });

        console.log('getPremium: ', data);
        if (!data.annualPremium || typeof data.annualPremium !== 'number') {
          throw new Error('Error calculating premium');
        }

        const { AALs } = data;
        if (onSuccess)
          onSuccess(
            data.annualPremium,
            {
              ...ratingInputs,
              inlandAAL: AALs.inland,
              surgeAAL: AALs.surge,
              tsunamiAAL: AALs.tsunami,
            },
            data.ratingDocId,
          );
        setLoading(false);

        return data.annualPremium;
      } catch (err: any) {
        console.log('ERROR: ', err);
        let msg = 'error recalculating premium';
        if (err.message) msg = err.message;

        if (onError) onError(msg);
        setLoading(false);
        return null;
      }
    },
    [functions, submissionId, onSuccess, onError],
  );

  return { rerate, loading, error }; // ratingInputsSnap
};
