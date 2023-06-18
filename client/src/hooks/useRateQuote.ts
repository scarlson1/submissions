import { useCallback, useState } from 'react';
import { useFunctions } from 'reactfire';

import { getAnnualPremium } from 'modules/api';
import { NewQuoteValues } from 'views/admin/QuoteNew';
import { GetAnnualPremiumRequest, RatingInputs } from 'modules/api/getAnnualPremium';
import invariant from 'tiny-invariant';
import { validateCommonInputs } from './useCalcPremium';

export interface RatingInputsWithAAL extends RatingInputs {
  inlandAAL: number | null;
  surgeAAL: number | null;
  tsunamiAAL: number | null;
}

export function extractRatingInputsFromValues(values: NewQuoteValues): RatingInputs {
  const { coordinates, limits, deductible, priorLossCount, address, ratingPropertyData } = values;

  let subproducerCommission =
    typeof values.subproducerCommission === 'string'
      ? parseFloat(values.subproducerCommission)
      : values.subproducerCommission;
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
    priorLossCount,
    floodZone: ratingPropertyData?.floodZone, // || undefined,
    basement: ratingPropertyData?.basement?.toLowerCase(), // || undefined,
    commissionPct: subproducerCommission || 0.15, // TODO: use env var ??
  };
}

export function getValidRatingInputs(values: NewQuoteValues) {
  const commValidated = validateCommonInputs(values);
  const { coordinates } = commValidated;

  invariant(coordinates?.latitude && coordinates?.longitude, 'coordinates required');

  return extractRatingInputsFromValues(commValidated);
}

export const useRateQuote = (
  submissionId: string | null,
  onSuccess?: (premium: number, ratingInputs: RatingInputsWithAAL) => void,
  onError?: (msg: string) => void
  // initialRatingSnap?: Optional<RatingInputs>
) => {
  const functions = useFunctions();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // TODO: delete ?? pass as prop - dup of state in QuoteNew
  // pass rating inputs when function called
  // const [ratingInputsSnap, setRatingInputsSnap] = useState<Optional<RatingInputs> | undefined>(
  //   initialRatingSnap
  // );

  const rerate = useCallback(
    async (values: NewQuoteValues) => {
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
          coordinates: { latitude: ratingInputs.latitude, longitude: ratingInputs.longitude },
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
          commissionPct: ratingInputs.commissionPct,
        };
        const { data } = await getAnnualPremium(functions, {
          ...reformatRatingInputs,
          submissionId,
        }); // ...ratingInputs

        console.log('PREMIUM RES: ', data);
        if (!data.annualPremium || typeof data.annualPremium !== 'number') {
          throw new Error('Error calculating premium');
        }

        const { AAL } = data;
        if (onSuccess)
          onSuccess(data.annualPremium, {
            ...ratingInputs,
            inlandAAL: AAL.inland,
            surgeAAL: AAL.surge,
            tsunamiAAL: AAL.tsunami,
          });
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
    [functions, submissionId, onSuccess, onError]
  );

  return { rerate, loading, error }; // ratingInputsSnap
};
